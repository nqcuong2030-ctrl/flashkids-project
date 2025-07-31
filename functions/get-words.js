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

        // Lọc ra các categories và flashcards chỉ thuộc về level được yêu cầu
        const levelCategories = allData.categories.filter(cat => cat.level === level);
        const levelFlashcards = allData.flashcards.filter(card => card.level === level);

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