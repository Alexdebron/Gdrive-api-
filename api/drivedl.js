
import axios from "axios";

export default async function handler(req, res) {
    try {
        const url = req.query.url;
        const API_KEY = "AIzaSyAA9ERw-9LZVEohRYtCWka_TQc6oXmvcVU";

        if (!url)
            return res.status(400).json({ error: true, message: "Missing Google Drive URL" });

        const extractFileId = (driveUrl) => {
            const patterns = [
                /\/file\/d\/([a-zA-Z0-9_-]+)/,
                /id=([a-zA-Z0-9_-]+)/,
                /folders\/([a-zA-Z0-9_-]+)/,
                /^([a-zA-Z0-9_-]+)$/
            ];
            for (const pattern of patterns) {
                const match = driveUrl.match(pattern);
                if (match) return match[1];
            }
            return null;
        };

        const fileId = extractFileId(url);
        if (!fileId)
            return res.status(400).json({ error: true, message: "Invalid Google Drive URL" });

        const { data: metadata } = await axios.get(
            `https://www.googleapis.com/drive/v3/files/${fileId}?key=${API_KEY}&fields=id,name,mimeType,size,webContentLink,owners,createdTime`
        );

        if (metadata.mimeType === "application/vnd.google-apps.folder") {
            const { data: list } = await axios.get(
                `https://www.googleapis.com/drive/v3/files?key=${API_KEY}&q='${fileId}'+in+parents&fields=files(id,name,mimeType,size,owners,createdTime)`
            );

            const files = list.files || [];

            return res.json({
                creator: "Chamod Nimsara",
                contact: "0704896880",
                type: "folder",
                folder: {
                    id: metadata.id,
                    name: metadata.name,
                    totalFiles: files.length,
                    createdTime: metadata.createdTime
                },
                contents: files.map(file => ({
                    id: file.id,
                    name: file.name,
                    size: file.size || "N/A",
                    mimeType: file.mimeType,
                    downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media&key=${API_KEY}`
                }))
            });
        }

        return res.json({
            creator: "Chamod Nimsara",
            contact: "0704896880",
            type: "file",
            file: {
                id: metadata.id,
                name: metadata.name,
                mimeType: metadata.mimeType,
                size: metadata.size || "N/A"
            },
            downloadUrl: `https://www.googleapis.com/drive/v3/files/${metadata.id}?alt=media&key=${API_KEY}`,
            directDownload: metadata.webContentLink
        });

    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
}
