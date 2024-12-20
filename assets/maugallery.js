(function($) { 
  // Création d'un plugin jQuery en encapsulant tout dans une IIFE (Immediately Invoked Function Expression)
  $.fn.mauGallery = function(options) {
    // Fusionner les options par défaut avec celles passées par l'utilisateur
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = []; // Collection des tags pour le filtrage

    // Appliquer le plugin à chaque élément sélectionné
    return this.each(function() {
      // Créer un wrapper pour organiser les éléments en "row"
      $.fn.mauGallery.methods.createRowWrapper($(this));

      // Si l'option lightBox est activée, créer une lightbox
      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox(
          $(this),
          options.lightboxId,
          options.navigation
        );
      }

      // Ajouter les listeners nécessaires pour les interactions
      $.fn.mauGallery.listeners(options);

      // Parcourir chaque élément de la galerie pour l'organiser et collecter les tags
      $(this)
        .children(".gallery-item")
        .each(function(index) {
          // Rendre les images responsives
          $.fn.mauGallery.methods.responsiveImageItem($(this)); 
          // Placer l'élément dans un wrapper
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this)); 
          // Organiser les éléments en colonnes
          $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);

          // Collecter les tags si activé
          var theTag = $(this).data("gallery-tag");
          if (
            options.showTags &&
            theTag !== undefined &&
            tagsCollection.indexOf(theTag) === -1
          ) {
            tagsCollection.push(theTag);
          }
        });

      // Afficher les tags si l'option showTags est activée
      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          $(this),
          options.tagsPosition,
          tagsCollection
        );
      }

      // Animer l'affichage de la galerie
      $(this).fadeIn(500);
    });
  };

  // Définition des options par défaut du plugin
  $.fn.mauGallery.defaults = {
    columns: 3,             // Nombre de colonnes
    lightBox: true,         // Activer ou non la lightbox
    lightboxId: null,       // ID de la lightbox
    showTags: true,         // Afficher ou non les tags
    tagsPosition: "bottom", // Position des tags : "top" ou "bottom"
    navigation: true        // Activer la navigation dans la lightbox
  };

  // Gestion des listeners pour les interactions
  $.fn.mauGallery.listeners = function(options) {
    // Listener pour ouvrir la lightbox lorsqu'un élément est cliqué
    $(".gallery-item").on("click", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    // Listener pour filtrer les éléments par tag
    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);

    // Listeners pour naviguer dans la lightbox
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
  };

  // Ensemble des méthodes utilisées par le plugin
  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      // Ajouter un wrapper "row" pour organiser les éléments si absent
      if (
        !element
          .children()
          .first()
          .hasClass("row")
      ) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    wrapItemInColumn(element, columns) {
      // Organiser un élément en fonction des colonnes spécifiées
      if (columns.constructor === Number) {
        element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        // Gérer les colonnes pour différentes tailles d'écran (responsives)
        var columnClasses = "";
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },

    moveItemInRowWrapper(element) {
      // Déplacer l'élément dans le wrapper "row"
      element.appendTo(".gallery-items-row");
    },

    responsiveImageItem(element) {
      // Ajouter une classe pour rendre les images responsives
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },

    openLightBox(element, lightboxId) {
      // Ouvrir la lightbox avec l'image cliquée
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },

    prevImage(lightboxId) {
      // Afficher l'image précédente dans la lightbox
      let activeImage = null;

      // Trouver l'image actuellement affichée dans la lightbox
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(`#${lightboxId}`).find(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });

      // Récupérer la collection d'images de la galerie
      const images = $("img.gallery-item");
      let prevIndex = images.index(activeImage) - 1;

      // Si l'on dépasse le début, revenir à la dernière image
      if (prevIndex < 0) {
        prevIndex = images.length - 1;
      }

      // Afficher l'image précédente en changeant la source dans la lightbox
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", $(images[prevIndex]).attr("src"));
    },

    nextImage(lightboxId) {
      // Afficher l'image suivante dans la lightbox
      let activeImage = null;

      // Trouver l'image actuellement affichée dans la lightbox
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(`#${lightboxId}`).find(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });

      // Récupérer la collection d'images de la galerie
      const images = $("img.gallery-item");
      let nextIndex = images.index(activeImage) + 1;

      // Si l'on dépasse la fin, revenir à la première image
      if (nextIndex >= images.length) {
        nextIndex = 0;
      }

      // Afficher l'image suivante en changeant la source dans la lightbox
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", $(images[nextIndex]).attr("src"));
    },

    createLightBox(gallery, lightboxId, navigation) {
      // Créer le HTML de la lightbox et l'ajouter à la galerie
    },

    showItemTags(gallery, position, tags) {
      // Générer et afficher les tags pour filtrer les éléments
    },

    filterByTag() {
      // Filtrer les éléments de la galerie en fonction du tag sélectionné
    }
  };
})(jQuery);
