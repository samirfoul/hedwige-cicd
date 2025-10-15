Grimoire Complet du Projet Hedwige & CI/CD
Ce document est une archive complète et commentée de la création de l'application "Hedwige". Il contient les explications de chaque étape ainsi que le code final et fonctionnel correspondant, prêt à être versionné avec Git.

I. Le Backend : "Hedwige-Express" (Python & Docker)
Notre backend est une petite application Python qui sert de cerveau à notre projet. Il est conçu pour être léger, testable et facilement déployable.

Étape 1 : Création du Squelette de l'Application
Objectif : Mettre en place une base de code minimale mais robuste, avec des tests pour garantir son bon fonctionnement.

Code hedwige-express/requirements.txt (version initiale) :

Flask
pytest

Code hedwige-express/app.py (version initiale) :

from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def index():
    return jsonify({"message": "Hedwige est prête !"})

if __name__ == '__main__':
    app.run(debug=True)

Code hedwige-express/tests/test_app.py :

import pytest
from app import app as flask_app

@pytest.fixture
def app():
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_index(client):
    """Teste la route principale."""
    response = client.get('/')
    assert response.status_code == 200
    assert response.json == {"message": "Hedwige est prête !"}

Étape 2 : La Dockerisation (le Portoloin)
Objectif : Rendre notre application portable et reproductible grâce à Docker, en la préparant pour un environnement de production.

Code hedwige-express/requirements.txt (version mise à jour pour la production) :

Flask
pytest
gunicorn

Code hedwige-express/Dockerfile :

# Étape 1 : L'image de base
FROM python:3.9-slim

# Étape 2 : Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Étape 3 : Installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Étape 4 : Copier le code de l'application
COPY . .

# Étape 5 : Exposer le port que Gunicorn utilisera
EXPOSE 5001

# Étape 6 : Commande pour lancer l'application
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]

Étape 3 : Ajout de la Route d'Authentification
Objectif : Donner au backend la capacité de vérifier l'identité d'un utilisateur en validant un jeton Google.

Code hedwige-express/requirements.txt (version finale) :

Flask
pytest
gunicorn
google-auth
requests
flask-cors

Code hedwige-express/app.py (version finale) :

from flask import Flask, jsonify, request
from google.oauth2 import id_token
from google.auth.transport import requests
from flask_cors import CORS # Important pour autoriser les requêtes du frontend

app = Flask(__name__)
# Active CORS pour autoriser les requêtes depuis http://localhost:4200
CORS(app, resources={r"/api/*": {"origins": "http://localhost:4200"}})

@app.route("/")
def index():
    return jsonify({"message": "Hedwige est prête !"})

@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    token_data = request.get_json()
    token = token_data.get('credential')

    if not token:
        return jsonify({"error": "Jeton manquant"}), 400

    try:
        # Remplacez par votre propre ID Client (celui du frontend)
        CLIENT_ID = "168327457573-ap4pe9peilrhpcdpnri7kvo4lb6q7eds.apps.googleusercontent.com"
        id_info = id_token.verify_oauth2_token(token, requests.Request(), CLIENT_ID)

        user_info = {
            "email": id_info['email'],
            "name": id_info['name'],
            "picture": id_info['picture'],
            "given_name": id_info.get('given_name', '')
        }
        return jsonify(user_info), 200

    except ValueError as e:
        print(f"Erreur de vérification du jeton : {e}")
        return jsonify({"error": "Jeton Google invalide"}), 401

if __name__ == '__main__':
    app.run(debug=True, port=5001)

II. Le Pipeline CI/CD (GitHub Actions)
Objectif : Automatiser les tests, la validation du code et la publication de notre image Docker à chaque modification du code.

Étape 1 : Le Pacte des Secrets (Docker Hub & GitHub)
Objectif : Permettre à GitHub Actions de se connecter à Docker Hub de manière sécurisée, sans jamais exposer de mot de passe dans le code.

Action A : Créer un Jeton d'Accès sur Docker Hub

Se connecter à hub.docker.com.

Cliquer sur son nom d'utilisateur en haut à droite, puis sur "Account Settings".

Aller dans la section "Security".

Cliquer sur "New Access Token".

Donner un nom au jeton (ex: github-actions-hedwige) et cliquer sur "Generate".

Copier immédiatement le jeton généré. C'est le seul moment où il sera visible.

Action B : Stocker les Secrets dans GitHub

Aller sur le dépôt GitHub du projet.

Cliquer sur l'onglet "Settings", puis "Secrets and variables" > "Actions".

Cliquer sur "New repository secret".

Name : DOCKERHUB_USERNAME

Secret : Votre nom d'utilisateur Docker Hub.

Cliquer à nouveau sur "New repository secret".

Name : DOCKERHUB_TOKEN

Secret : Le jeton d'accès copié depuis Docker Hub.

Étape 2 : Création du Fichier de Workflow
Code .github/workflows/main.yml :

name: Pipeline CI/CD pour Hedwige-Express

# Déclencheur : s'exécute à chaque push sur la branche main
on:
  push:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      # Étape 1 : Récupérer le code du dépôt
      - name: Checkout code
        uses: actions/checkout@v3

      # Étape 2 : Configurer Python
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      # Étape 3 : Installer les dépendances
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 pytest
          pip install -r requirements.txt

      # Étape 4 : Linter le code (vérification de la qualité)
      - name: Lint with flake8
        run: |
          # stop the build if there are Python syntax errors or undefined names
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          # exit-zero treats all errors as warnings. The GitHub editor is 127 chars wide
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

      # Étape 5 : Lancer les tests unitaires
      - name: Run Unit Tests
        run: |
          python3 -m pytest

      # Étape 6 : Se connecter à Docker Hub
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      # Étape 7 : Construire et pousser l'image Docker
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/hedwige-express:latest

III. Le Frontend : "Hedwige-Frontend" (Angular)
Objectif : Créer une interface utilisateur interactive qui permet de s'authentifier avec Google et de communiquer avec notre backend.

Code hedwige-frontend/src/index.html :

<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HedwigeFrontend</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <!-- Ajout du script officiel de connexion Google -->
  <script src="[https://accounts.google.com/gsi/client](https://accounts.google.com/gsi/client)" async defer></script>
</head>
<body>
  <app-root></app-root>
</body>
</html>

Code hedwige-frontend/src/app/app.config.ts (version finale et nettoyée) :

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient() // Activation du module de communication HTTP
  ]
};

Code hedwige-frontend/src/app/app.component.ts (version finale et fonctionnelle) :

import { Component, NgZone, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

declare const google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex h-screen w-full bg-gray-900 text-gray-200 font-sans">
      <aside class="w-64 flex-shrink-0 bg-gray-800/50 p-6">
        <div class="flex items-center space-x-3 mb-10">
          <svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" class="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span class="text-2xl font-bold tracking-wider">Hedwige</span>
        </div>
        <nav class="space-y-3">
          <a *ngFor="let folder of folders" href="#" 
            (click)="setActiveFolder(folder.name); $event.preventDefault()"
            [class]="getFolderClasses(folder.name)">
            <div class="h-6 w-6" [innerHTML]="sanitizeIcon(folder.icon)"></div>
            <span class="font-medium">{{ folder.name }}</span>
          </a>
        </nav>
      </aside>
      <main class="flex-1 flex flex-col">
        <header class="flex h-24 flex-shrink-0 items-center justify-between border-b border-gray-700/50 px-8">
          <h1 class="text-3xl font-light text-gray-400">{{ activeFolder }}</h1>
          <div *ngIf="user" class="flex items-center space-x-4">
            <span class="font-medium">{{ user.name }}</span>
            <img [src]="user.picture" class="h-12 w-12 rounded-full" alt="Photo de profil" />
            <button (click)="signOut()" class="rounded-full bg-gray-700 px-4 py-2 text-white">Déconnexion</button>
          </div>
          <div *ngIf="!user" class="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500"></div>
        </header>
        <div class="flex-1 flex items-center justify-center p-8">
          <div *ngIf="!user" class="w-full max-w-lg text-center">
            <h2 class="text-4xl font-bold text-white mb-4">Bienvenue dans Hedwige Mail</h2>
            <p class="text-lg text-gray-400 mb-8">
              Connectez-vous pour envoyer et recevoir vos parchemins numériques.
            </p>
            <div id="google-btn"></div>
          </div>
          <div *ngIf="user" class="w-full max-w-lg text-center">
              <h2 class="text-4xl font-bold text-white mb-4">Bienvenue, {{ user.given_name }} !</h2>
              <p class="text-lg text-gray-400 mb-8">Vous êtes authentifié auprès de notre service.</p>
          </div>
        </div>
      </main>
    </div>
  `
})
export class AppComponent implements AfterViewInit {
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);
  private http = inject(HttpClient);

  user: any = null;
  activeFolder = 'Boîte de réception';
  backendUrl = 'http://localhost:5001';

  folders = [
    { name: 'Boîte de réception', icon: '<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>' },
    { name: 'Envoyés', icon: '<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>' },
    { name: 'Corbeille', icon: '<svg xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>' }
  ];

  ngAfterViewInit(): void {
    google.accounts.id.initialize({
      client_id: '168327457573-ap4pe9peilrhpcdpnri7kvo4lb6q7eds.apps.googleusercontent.com',
      callback: (response: any) => {
        this.ngZone.run(() => {
          this.handleCredentialResponse(response);
        });
      }
    });
    google.accounts.id.renderButton(document.getElementById('google-btn'), { theme: 'outline', size: 'large', type: 'standard', shape: 'pill' });
  }

  handleCredentialResponse(response: any) {
    if (response.credential) {
      this.http.post(`${this.backendUrl}/api/auth/google`, { credential: response.credential })
        .subscribe({
          next: (backendUser: any) => {
            console.log("Authentification réussie côté backend !", backendUser);
            // On utilise les infos vérifiées par le backend pour plus de sécurité
            this.user = backendUser; 
          },
          error: (err) => {
            console.error("Erreur d'authentification backend:", err);
            this.signOut();
          }
        });
    }
  }

  signOut(): void {
    google.accounts.id.disableAutoSelect();
    this.user = null;
  }

  setActiveFolder(folderName: string) { this.activeFolder = folderName; }
  sanitizeIcon(icon: string): SafeHtml { return this.sanitizer.bypassSecurityTrustHtml(icon); }
  getFolderClasses(folderName: string): string {
    const baseClasses = "flex items-center space-x-4 rounded-lg p-3 text-gray-400 transition-all duration-200 hover:bg-gray-700/50 hover:text-white";
    if (folderName === this.activeFolder) { return `${baseClasses} bg-cyan-400/20 text-cyan-300`; }
    return baseClasses;
  }
}
