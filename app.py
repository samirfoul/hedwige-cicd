from flask import Flask, jsonify, request
from google.oauth2 import id_token
from google.auth.transport import requests
from flask_cors import CORS # Importation de CORS

app = Flask(__name__)

# --- Configuration de CORS ---
# Cela autorise les requêtes provenant de votre application Angular (http://localhost:4200)
# à communiquer avec ce serveur.
CORS(app) 

# --- Route de bienvenue (existante) ---
@app.route("/")
def index():
    """
    Route principale pour vérifier que le service est en ligne.
    """
    return jsonify({"message": "Hedwige est prête !"})

# --- NOUVELLE ROUTE : Vérification du jeton Google ---
@app.route("/api/auth/google", methods=['POST'])
def google_auth():
    """
    Reçoit un jeton d'identité de Google envoyé par le frontend.
    Le vérifie pour authentifier l'utilisateur.
    """
    token_data = request.get_json()
    token = token_data.get('credential')

    if not token:
        return jsonify({"error": "Jeton manquant"}), 400

    try:
        # On vérifie le jeton auprès des serveurs de Google
        # en s'assurant qu'il a bien été émis pour NOTRE application.
        id_info = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            "168327457573-ap4pe9peilrhpcdpnri7kvo4lb6q7eds.apps.googleusercontent.com"
        )

        # On récupère les informations utiles de l'utilisateur
        user_info = {
            "email": id_info['email'],
            "name": id_info['name'],
            "picture": id_info['picture'],
        }
        
        # On renvoie les informations au frontend pour confirmer la connexion
        return jsonify(user_info), 200

    except ValueError as e:
        # Le jeton est invalide
        print(f"Erreur de vérification du jeton : {e}")
        return jsonify({"error": "Jeton Google invalide"}), 401

# --- Permet de lancer le serveur en mode développement ---
if __name__ == '__main__':
    app.run(debug=True, port=5001)
