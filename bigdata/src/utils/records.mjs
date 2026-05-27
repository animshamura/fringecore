import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, "../../data/records.json");

const getAllRecord = () => {
    const rawData = fs.readFileSync(dataFilePath, "utf-8");
    return JSON.parse(rawData);
};

export const recordExists = (id) => {
    const s = Date.now();
    const data = getAllRecord();
    return !!data[id];
};

export const getRecord = async (id) => {
    const data = getAllRecord();
    return new Promise((resolve) =>
        setTimeout(() => {
            resolve(data[id] || null);
        }, data[id]?.readDelay)
    );
};

export const updateRecord = async (id, body) => {
    const data = getAllRecord();
    const existingRecord = data[id];
    data[id] = {
        ...data[id],
        ...body,
    };
    return await new Promise((resolve) =>
        setTimeout(() => {
            fs.writeFileSync(
                dataFilePath,
                JSON.stringify(data, null, 4),
                "utf-8"
            );
            resolve(data[id]);
        }, existingRecord?.writeDelay)
    );
};
