#!/bin/bash

# Скрипт для автоматического создания бэкапа базы данных PostgreSQL
# Использование: ./backup-db.sh

# Настройки (можно переопределить через переменные окружения)
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
DB_NAME="${DB_NAME:-camerahub}"
DB_USER="${DB_USER:-camerahub_user}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

# Создаем директорию для бэкапов, если её нет
mkdir -p "$BACKUP_DIR"

# Формируем имя файла с датой и временем
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${DATE}.dump"

echo "🔄 Создание бэкапа базы данных..."
echo "📦 База данных: $DB_NAME"
echo "💾 Файл бэкапа: $BACKUP_FILE"

# Создание бэкапа
sudo -u postgres pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Получаем размер файла
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Бэкап успешно создан!"
    echo "📊 Размер файла: $FILE_SIZE"
    
    # Удаление старых бэкапов
    echo ""
    echo "🧹 Очистка старых бэкапов (старше $RETENTION_DAYS дней)..."
    DELETED=$(find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.dump" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    if [ $DELETED -eq 0 ]; then
        echo "✅ Старые бэкапы не найдены"
    else
        echo "✅ Удалено старых бэкапов: $DELETED"
    fi
    
    echo ""
    echo "✅ Готово!"
else
    echo "❌ Ошибка создания бэкапа!"
    exit 1
fi

