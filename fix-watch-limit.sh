#!/bin/bash
# Script pour augmenter la limite de surveillance de fichiers sur Linux

echo "🔧 Augmentation de la limite de surveillance de fichiers..."

# Vérifier la limite actuelle
CURRENT_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches)
echo "📊 Limite actuelle : $CURRENT_LIMIT"

# Augmenter temporairement (pour la session actuelle)
echo "⚡ Augmentation temporaire..."
echo 524288 | sudo tee /proc/sys/fs/inotify/max_user_watches

# Vérifier la nouvelle limite
NEW_LIMIT=$(cat /proc/sys/fs/inotify/max_user_watches)
echo "✅ Nouvelle limite : $NEW_LIMIT"

# Ajouter de manière permanente dans /etc/sysctl.conf
if ! grep -q "fs.inotify.max_user_watches" /etc/sysctl.conf; then
    echo "💾 Ajout de la configuration permanente..."
    echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
    echo "✅ Configuration permanente ajoutée"
else
    echo "ℹ️  La configuration existe déjà dans /etc/sysctl.conf"
fi

echo ""
echo "🎉 Terminé ! Vous pouvez maintenant relancer 'npm run dev'"

