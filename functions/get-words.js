// functions/get-words.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
    console.log('--- Function get-words invoked ---'); // LOG 1: Báo function đã chạy

    const { level } = event.queryStringParameters;
    console.log('Requesting level:', level); // LOG 2: Báo level nhận được

    if (!level) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Thiếu tham số level.' }),
        };
    }

    // Tạo đường dẫn an toàn đến file JSON
    const filePath = path.resolve(__dirname, '..', 'data', `flashcards-${level}.json`);
    console.log('Attempting to read file at path:', filePath); // LOG 3: In ra đường dẫn file đầy đủ

    try {
        const data = await fs.readFile(filePath, 'utf8');
        console.log('Successfully read file.'); // LOG 4: Báo đã đọc file thành công
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: data,
        };
    } catch (error) {
        console.error('ERROR reading file:', error); // LOG 5: In ra lỗi chi tiết nếu thất bại
        return {
            statusCode: 404,
            body: JSON.stringify({ error: `Không tìm thấy dữ liệu cho level ${level}.`, details: error.message }),
        };
    }
};