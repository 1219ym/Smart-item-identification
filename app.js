// app.js
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const request = require('request');

const app = express();
const port = 5473;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const AK = "dQc7C4y63m9TEXRNe5Y0hIQ2";
const SK = "74vX6U3R3G2tzwhsmu7wMQzX6GNdhOZG";
const API_URL = 'https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general';

let access_token = null;

function getAccessToken(callback) {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`;

    request({ url: tokenUrl, json: true }, (error, response, body) => {
        if (error || !body.access_token) {
            console.error('获取 access_token 失败。');
            callback(null);
        } else {
            access_token = body.access_token;
            callback(access_token);
        }
    });
}

app.post('/recognize', upload.single('image'), (req, res) => {
    const imageBuffer = req.file.buffer;

    function handleRecognition(token) {
        if (!token) {
            res.status(500).json({ error: '无法获取 access_token' });
            return;
        }

        const requestOptions = {
            method: 'POST',
            url: `${API_URL}?access_token=${token}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
            },
            form: {
                image: imageBuffer.toString('base64'),
                baike_num: 5,
            },
        };

        request(requestOptions, (error, response, body) => {
            if (error) {
                console.error('错误:', error);
                res.status(500).json({ error: '识别失败', details: error.message });
            } else {
                try {
                    const data = JSON.parse(body);
                    console.log('识别结果:', data);
                    if (data.result && data.result.length > 0) {
                        const keywordsWithBaike = data.result.map((item) => ({
                            keyword: item.keyword,
                            baike_info: item.baike_info
                        }));
                        res.json({ result: keywordsWithBaike });
                    } else {
                        res.status(500).json({ error: '识别结果为空' });
                    }
                } catch (error) {
                    console.error('解析 JSON 错误:', error);
                    res.status(500).json({ error: '解析 JSON 响应错误', details: error.message });
                }
            }
        });
    }

    if (!access_token) {
        getAccessToken(handleRecognition);
    } else {
        handleRecognition(access_token);
    }
});

app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});
