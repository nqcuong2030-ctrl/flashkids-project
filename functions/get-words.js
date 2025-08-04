// functions/get-words.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    const { level } = event.queryStringParameters;

    if (!level) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Thiếu tham số level.' }) };
    }

    const filePath = path.resolve(__dirname, '..', 'data', 'flashcards-all.json');

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const allData = JSON.parse(fileContent);

        // --- LOGIC LỌC ĐÃ ĐƯỢC NÂNG CẤP ---
        // 1. Lọc ra các chủ đề có chứa level đang được yêu cầu trong mảng "level" của nó
        const levelCategories = allData.categories.filter(cat => 
            Array.isArray(cat.level) && cat.level.map(l => l.toLowerCase()).includes(level.toLowerCase())
        );

        // 2. Lọc các flashcards vẫn giữ nguyên như cũ (vì level của flashcard là string)
        const levelFlashcards = allData.flashcards.filter(card => 
            card.level && card.level.toLowerCase() === level.toLowerCase()
        );
        // --- KẾT THÚC NÂNG CẤP ---

        const responseData = {
            categories: levelCategories,
            flashcards: levelFlashcards
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseData),
        };
    } catch (error) {
        console.error('ERROR reading or processing file:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Lỗi xử lý file dữ liệu.' }),
        };
    }
};