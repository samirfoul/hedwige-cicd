
import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Déclare la variable globale 'google' pour éviter les erreurs TypeScript
declare var google: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, // Nécessaire pour les directives comme *ngIf, *ngFor
  ],

  // Le HTML est directement ici, dans la propriété 'template'
  template: `
    <div class="flex h-screen w-full bg-gray-900 text-gray-200 font-sans">

      <!-- Barre latérale magique -->
      <aside class="w-64 flex-shrink-0 bg-gray-800/50 p-6">
        <div class="flex items-center space-x-3 mb-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span class="text-2xl font-bold tracking-wider">Hedwige</span>
        </div>
        <nav class="space-y-3">
          <!-- Boucle sur les dossiers -->
          <a *ngFor="let folder of folders" href="#"
            (click)="setActiveFolder(folder.name); $event.preventDefault()"
            [class]="getFolderClasses(folder.name)">
            <div class="h-6 w-6" [innerHTML]="sanitizeIcon(folder.icon)"></div>
            <span class="font-medium">{{ folder.name }}</span>
          </a>
        </nav>
      </aside>

      <!-- Zone de contenu principal -->
      <main class="flex-1 flex flex-col">
        <header class="flex h-24 flex-shrink-0 items-center justify-between border-b border-gray-700/50 px-8">
          <h1 class="text-3xl font-light text-gray-400">{{ activeFolder }}</h1>

          <!-- Affiche les informations de l'utilisateur si connecté -->
          <div *ngIf="user" class="flex items-center space-x-4">
            <span class="hidden sm:inline text-gray-300 font-medium">{{ user.name }}</span>
            <img [src]="user.picture" class="h-10 w-10 rounded-full" alt="User avatar">
            <button (click)="logout()" class="rounded-full bg-gray-700/80 px-4 py-2 text-white transition-colors hover:bg-gray-600/80">Déconnexion</button>
          </div>

          <!-- Affiche une icône par défaut si non connecté -->
          <div *ngIf="!user" class="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500"></div>
        </header>

        <!-- Vue de connexion si l'utilisateur n'est pas connecté -->
        <div *ngIf="!user" class="flex-1 flex items-center justify-center p-8">
          <div class="w-full max-w-lg text-center">
            <h2 class="text-4xl font-bold text-white mb-4">Bienvenue dans Hedwige Mail</h2>
            <p class="text-lg text-gray-400 mb-8">
              Votre service de messagerie magique. Connectez-vous pour envoyer et recevoir vos parchemins numériques en toute sécurité.
            </p>
            <!-- Le bouton de connexion Google sera injecté ici par le script -->
            <div id="google-button" class="flex justify-center"></div>
          </div>
        </div>

        <!-- Vue de la messagerie si l'utilisateur est connecté -->
        <div *ngIf="user" class="flex-1 p-8 overflow-y-auto">
            <div class="bg-gray-800/50 rounded-lg p-6">
                <h2 class="text-2xl font-semibold text-white mb-4">Bonjour, {{ user.given_name }} !</h2>
                <p class="text-gray-400 mb-6">
                    Vous êtes maintenant connecté avec l'adresse : {{ user.email }}. La prochaine étape est de récupérer vos e-mails depuis votre middleware !
                </p>
                <!-- Exemple de liste d'e-mails -->
                <div class="mt-6 space-y-4">
                    <div class="flex items-center justify-between rounded-lg bg-gray-700/50 p-4 opacity-75 cursor-not-allowed">
                        <div>
                            <p class="font-medium text-white">De : Albus Dumbledore</p>
                            <p class="text-gray-400 text-sm">Sujet : Points pour Gryffondor</p>
                        </div>
                        <p class="text-sm text-gray-500">Il y a 2 heures</p>
                    </div>
                    <div class="flex items-center justify-between rounded-lg bg-gray-700/50 p-4 opacity-75 cursor-not-allowed">
                        <div>
                            <p class="font-medium text-white">De : Rubeus Hagrid</p>
                            <p class="text-gray-400 text-sm">Sujet : Soin aux créatures magiques</p>
                        </div>
                        <p class="text-sm text-gray-500">Hier</p>
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  `,
})
export class AppComponent implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);

  title = 'hedwige-frontend';
  activeFolder = 'Boîte de réception';
  user: any = null; // Pour stocker les informations de l'utilisateur connecté

  folders = [
    { name: 'Boîte de réception', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>' },
    { name: 'Envoyés', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>' },
    { name: 'Corbeille', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>' }
  ];

  ngOnInit() {
    this.loadGoogleClientScript();
  }

  loadGoogleClientScript() {
    // Vérifie si le script n'est pas déjà chargé
    if (document.getElementById('google-client-script')) {
        return;
    }
    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  }

  initializeGoogleSignIn() {
    google.accounts.id.initialize({
      // REMPLACEZ PAR VOTRE VRAI ID CLIENT GOOGLE CLOUD
      client_id: '168327457573-ap4pe9peilrhpcdpnri7kvo4lb6q7eds.apps.googleusercontent.com',
      callback: this.handleCredentialResponse.bind(this)
    });

    const googleButton = document.getElementById('google-button');
    if (googleButton) {
        google.accounts.id.renderButton(
            googleButton,
            { theme: 'outline', size: 'large', type: 'standard', text: 'signin_with', shape: 'pill' }
        );
    }
  }

  handleCredentialResponse(response: any) {
    // Le token JWT est dans response.credential
    // Pour le défi, ce token doit être envoyé et vérifié par votre middleware
    // Pour l'instant, nous décodons le profil côté client pour l'affichage

    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    // NgZone permet de s'assurer que les changements sont bien détectés par Angular
    this.ngZone.run(() => {
      this.user = JSON.parse(jsonPayload);
      console.log('Utilisateur connecté:', this.user);
    });
  }

  logout() {
    // Réinitialise l'objet utilisateur
    this.user = null;
    // Désactive la connexion automatique pour la prochaine visite
    google.accounts.id.disableAutoSelect();
  }

  setActiveFolder(folderName: string) {
    this.activeFolder = folderName;
  }

  sanitizeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }

  getFolderClasses(folderName: string): string {
    const baseClasses = "flex items-center space-x-4 rounded-lg p-3 text-gray-400 transition-all duration-200 hover:bg-gray-700/50 hover:text-white";
    if (folderName === this.activeFolder) {
      return `${baseClasses} bg-cyan-400/20 text-cyan-300`;
    }
    return baseClasses;
  }
}
