# Guide workflow admin/livreur

## 1. Attribution et gestion des commandes
- L’admin assigne une commande à un livreur (via l’interface admin).
- Dès qu’une commande est assignée et passe au statut "Livraison en cours", le statut du livreur passe automatiquement à "En livraison".
- Le livreur ne peut pas se mettre "Disponible" tant qu’il a une commande active.
- Quand toutes les commandes du livreur sont "Livré" ou "Annulé", le statut repasse à "Disponible" automatiquement.

## 2. Actions côté livreur
- Le livreur voit ses commandes en cours et peut suivre le workflow (GPS, confirmation, arrivée).
- Il peut se mettre "Hors service" manuellement (ex : pause, panne), mais pas "Disponible" si une commande est en cours.
- Il ne peut pas modifier le statut d’une commande (livraison, confirmation) sans passer par les étapes prévues.

## 3. Actions côté admin
- L’admin peut :
  - Assigner ou réassigner une commande à un livreur.
  - Forcer le statut d’un livreur (ex : "Indisponible" en cas de problème).
  - Voir en temps réel le statut des livreurs et des commandes.
- L’admin ne doit pas modifier le statut d’une commande sans raison (sauf cas exceptionnel).

## 4. Bonnes pratiques
- Toujours privilégier l’automatisation : le statut du livreur doit suivre le workflow des commandes.
- Ne jamais laisser un livreur "Disponible" avec une commande en cours.
- L’admin doit intervenir uniquement en cas de blocage ou d’erreur.
- Les statuts doivent être synchronisés entre frontend et backend (éviter les incohérences).

## 5. Cas particuliers
- Si le livreur a un problème (panne, absence), l’admin peut le mettre "Indisponible" et réassigner la commande.
- Si une commande est annulée, le livreur repasse "Disponible".
- Si le livreur termine la livraison, le statut repasse "Disponible".

## 6. Sécurité et traçabilité
- Toutes les actions (changement de statut, attribution, confirmation) doivent être loggées.
- Les statuts doivent être visibles en temps réel pour éviter les doublons ou les oublis.

---

Ce guide assure un workflow fluide, sécurisé et automatisé pour la gestion des livreurs et des commandes.
