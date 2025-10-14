# Étape 1: Utiliser une image Python officielle comme base
# 'slim' est une version légère, parfaite pour la production.
FROM python:3.9-slim

# Étape 2: Définir un répertoire de travail dans le conteneur
# Toutes les commandes suivantes s'exécuteront à partir de ce dossier.
WORKDIR /app

# Étape 3: Copier et installer les dépendances
# On copie d'abord requirements.txt pour profiter du cache de Docker.
# Docker ne réinstallera les dépendances que si ce fichier a changé.
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Étape 4: Copier le reste du code de l'application
COPY . .

# Étape 5: Exposer le port que notre application utilisera
# Le serveur Gunicorn utilisera le port 5001, comme défini dans app.py.
EXPOSE 5001

# Étape 6: Définir la commande pour démarrer le serveur
# On utilise gunicorn, un serveur de production robuste pour les applications Python.
# --bind 0.0.0.0:5001 rend l'application accessible depuis l'extérieur du conteneur.
# app:app fait référence à l'objet 'app' dans le fichier 'app.py'.
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
