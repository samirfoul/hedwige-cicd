from flask import Flask, jsonify

# Création de l'instance de l'application Flask
app = Flask(__name__)

@app.route('/')
def home():
    """
    Cette fonction gère la route principale de l'application.
    Elle retourne un message simple au format JSON.
    """
    response_data = {
        "message": "Hedwige est prête !"
    }
    return jsonify(response_data)

# Ce bloc permet de lancer le serveur de développement
# directement en exécutant le fichier python (python3 app.py)
if __name__ == '__main__':
    app.run(debug=True, port=5001)
