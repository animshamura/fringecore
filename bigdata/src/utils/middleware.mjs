import { recordExists } from "./records.mjs";

export const validateRecordExists = (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({
            error: "Record ID is required",
        });
        return;
    }

    if (!recordExists(id)) {
        res.status(404).json({
            error: `Record with ID '${id}' not found`,
        });
        return;
    }

    next();
};

const MIN_DELAY = 100;
const MAX_DELAY = 15000;

export function validateWriteBody(req, res, next) {
    const body = req.body;
    if (!body || Object.keys(body).length === 0) {
        res.status(400).json({
            error: "Request body cannot be empty",
        });
        return;
    }
    if (body.age !== undefined && typeof body.age !== "number") {
        res.status(400).json({
            error: "age must be a number",
        });
        return;
    }

    if (body.name !== undefined && typeof body.name !== "string") {
        res.status(400).json({
            error: "name must be a string",
        });
        return;
    }

    if (
        body.readDelay !== undefined &&
        (typeof body.readDelay !== "number" ||
            Number(body.readDelay) < MIN_DELAY ||
            Number(body.readDelay) > MAX_DELAY)
    ) {
        res.status(400).json({
            error: `readDelay must be a number greater than or equal to ${MIN_DELAY} and less than or equal to ${MAX_DELAY}`,
        });

        return;
    }

    if (
        body.writeDelay !== undefined &&
        (typeof body.writeDelay !== "number" ||
            Number(body.writeDelay) < MIN_DELAY ||
            Number(body.writeDelay) > MAX_DELAY)
    ) {
        res.status(400).json({
            error: `writeDelay must be a number greater than or equal to ${MIN_DELAY} and less than or equal to ${MAX_DELAY}`,
        });
        return;
    }
    next();
}
