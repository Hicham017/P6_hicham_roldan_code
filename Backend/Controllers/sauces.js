//on importe le package fs de node
const fs = require("fs");

const Sauce = require("../models/Sauces");

//_________________________________________________________________________________________________________________________

exports.createSauce = (req, res, next) => {
  // le body de la requête contient une chaîne 'sauce', qui est un objet converti en chaîne
  // on l'analyse donc avec JSON.parse pour obtenir un objet utilisable

  const sauceObject = JSON.parse(req.body.sauce);
  //delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,

    // on doit résoudre l'URL complète de notre image, car req.file.filename ne contient que le segment filename
    // on utilise req.protocol pour obtenier le 1er segment ('http')
    // on ajoute '://', puis on utilise req.get('host') pour résoudre l'hôte du serveur (localhost:3000)
    // et on ajoute '/images/' et le nom de fichier pour compléter notre URL

    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => res.status(201).json({ message: "Objet enregistré !" }))
    .catch((error) => res.status(400).json({ error }));
};

//________________________________________________________________________________________________________________________

// on créer uun objet sauceObject qui regarde si req.file existe ou non
// s'il existe, on traite la nvelle img
// sinon on traite simplement l'objet entrant
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
   
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  //on créer ensuite une instance Sauce à p de sauceObject, puis on fait la modif
  // 1 arg = comment trohver l'objet
  // 2 dictionnairs
  Sauce.updateOne(
    { _id: req.params.id, userId : res.locals.userId }, 
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Objet modifié !" }))
    .catch((error) => res.status(400).json({ error 
    }));
};

//_________________________________________________________________________________________________________________________

//on réimplémente createSauce en important notre contrôlleur
//et en enregistrant createSauce

//_________________________________________________________________________________________________________________________

exports.deleteSauce = (req, res, next) => {
  // on utilise l'id qu'on reçoit comme param pour accéder à la Sauce correspondante dans la b. de données
  Sauce.findOne({ _id: req.params.id })
    .then((Sauces) => {

    //pb de sécu à la supression
      if (!Sauces) {
        res.status(404).json({ error: new Error('Sauce inexistante !')});
      }

      // comparer userID de la sauce
      if (Sauces.userId !== res.locals.userId) {
        res.status(401).json({ error: new Error('Requête non autorisée !')});
      }
      return Sauces;
    
    })
    .then(Sauces => {


      // on utilise le fait de savoir que notre URL d'image contient un segment
      // /images/ pour séparer le nom de fichier
      const filename = Sauces.imageUrl.split("/images/")[1];

      // on utilise la f° UNLINK de package fs pour suppr ce fichier, en lui passant le fichier à suppr
      // et le callback à exécuter une fois ce fichier suppr
      fs.unlink(`images/${filename}`, () => {
        //dans cette callback, on implémente la logique d'origine, en supprimant la Sauce de la b. de données
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: "Objet supprimé !" }))
          .catch((error) => res.status(400).json({ error }));
      });
     })
    .catch(error => res.status(500).json({ error }));

};

//_________________________________________________________________________________________________________________________

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

//_________________________________________________________________________________________________________________________

//_________________________________________________________________________________________________________________________

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//___________________________________________________________________________________________________________

exports.likeSauce = (req, res, next) => {
   Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    // verif si on est sur du like dislike ou ann°
    // si c un like, on verif si req.body.userid est dans userLiked
    if (req.body.like == 1 && !sauce.usersLiked.includes(req.body.userId)) {
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $inc: { likes: +1 }, //ajout du like
          $push: { usersLiked: req.body.userId },
        }
      )

        .then(() => res.status(200).json({ message: "Objet modifié !" }))
        .catch((error) => res.status(400).json({ error }));
    } else if (
      req.body.like == - 1 &&
      !sauce.usersDisliked.includes(req.body.userId)
    ) {
      Sauce.updateOne(
        { _id: req.params.id },
        {
          $inc: { dislikes: +1 },
          $push: { usersDisliked: req.body.userId },
        }
      )

        .then(() => res.status(200).json({ message: "Objet modifié !" }))
        .catch((error) => res.status(400).json({ error }));
    } else {
      if (sauce.usersDisliked.includes(req.body.userId)) {
        console.log('toto');
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $inc: { dislikes: -1 },
            $pull: { usersDisliked: req.body.userId },
          }
        )

          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(400).json({ error }));
      } else if (sauce.usersLiked.includes(req.body.userId)) {
        console.log('ok');
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $inc: { likes: - 1 },
            $pull: { usersLiked: req.body.userId },
          }
        )

          .then(() => res.status(200).json({ message: "Objet modifié !" }))
          .catch((error) => res.status(400).json({ error }));
      }
    }
  });
};

// sinon 121 130
// si c un dislike on verif si """" est dans user disliked
// sinon 121 130 en changeant like en
