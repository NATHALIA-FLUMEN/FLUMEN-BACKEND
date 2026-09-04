import { body } from 'express-validator';
import { validationResult } from 'express-validator';
import { badRequest } from '../utils/apiResponse.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const messages = errors.array().map((e) => e.msg);
    return badRequest(res, messages[0]);
  };
};

export const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Debes ingresar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 72 })
    .withMessage('La contraseña debe tener entre 8 y 72 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe tener al menos un número'),
  body('adminCode').optional().trim().isLength({ max: 100 })
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Email inválido').normalizeEmail(),
  body('password').isLength({ min: 1 }).withMessage('Contraseña requerida')
];

export const googleValidation = [
  body('idToken').isString().isLength({ min: 10, max: 500 }).withMessage('Token de Google inválido'),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('name').optional().trim().isLength({ max: 80 }),
  body('adminCode').optional().trim().isLength({ max: 100 })
];

export const profileUpdateValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Nombre inválido').escape(),
  body('avatarUrl').optional().isURL({ require_protocol: true }).withMessage('URL de avatar inválida')
];
