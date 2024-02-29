/* eslint-disable @typescript-eslint/no-unused-vars */
import LogManager from '@manager/LogManager';
import { CustomError } from '@web/CustomError';
import { NextFunction, Request, Response } from 'express';

/**
 * @description Errorhandler für die API. Wird immer aufgerufen, wenn ein Fehler auftritt. (z.B. 404) (Wird auch in der Konsole geloggt, wenn der Fehler geloggt werden soll.)
 * @author mKpwnz
 * @date 26.12.2023
 * @export
 * @param {Error} err
 * @param {Request} req
 * @param {Response} res
 * @returns {*}
 */
export default function handleError(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof CustomError) {
        const { statusCode, errors, logging } = err;
        if (logging) {
            LogManager.error({
                code: err.statusCode,
                errors: err.errors,
                stack: err.stack,
            });
        }
        return res.status(statusCode).send({ errors });
    }
    return res.status(500).send({
        status: 500,
        message: err.message,
    });
}
