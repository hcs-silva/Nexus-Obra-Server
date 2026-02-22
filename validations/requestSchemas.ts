import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const signupSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  password: Joi.string().min(1).required(),
  role: Joi.string().valid("masterAdmin", "Admin", "user", "guest").optional(),
  resetPassword: Joi.boolean().optional(),
});

export const loginSchema = Joi.object({
  username: Joi.string().trim().min(1).required(),
  password: Joi.string().min(1).required(),
});

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(1).required(),
});

export const createClientSchema = Joi.object({
  clientName: Joi.string().trim().min(1).required(),
  adminUsername: Joi.string().trim().min(1).required(),
  adminPassword: Joi.string().min(1).required(),
  clientLogo: Joi.string().trim().allow("").optional(),
});

export const updateClientSchema = Joi.object({
  clientName: Joi.string().trim().min(1).optional(),
  clientEmail: Joi.string().trim().email().optional(),
  clientPhone: Joi.string().trim().min(1).optional(),
  clientLogo: Joi.string().trim().allow("").optional(),
  clientAdmin: Joi.string().pattern(objectIdPattern).optional(),
  subStatus: Joi.boolean().optional(),
  Members: Joi.array().items(Joi.string().pattern(objectIdPattern)).optional(),
}).min(1);

export const manageClientMemberSchema = Joi.object({
  userId: Joi.string().pattern(objectIdPattern).required(),
});

export const createObraSchema = Joi.object({
  obraName: Joi.string().trim().min(1).required(),
  obraDescription: Joi.string().trim().allow("").optional(),
  obraLocation: Joi.string().trim().allow("").optional(),
  obraStatus: Joi.string()
    .valid("planning", "in-progress", "completed", "on-hold")
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  budget: Joi.number().min(0).optional(),
  clientId: Joi.string().pattern(objectIdPattern).required(),
  responsibleUsers: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .optional(),
});

export const updateObraSchema = Joi.object({
  obraName: Joi.string().trim().min(1).optional(),
  obraDescription: Joi.string().trim().allow("").optional(),
  obraLocation: Joi.string().trim().allow("").optional(),
  obraStatus: Joi.string()
    .valid("planning", "in-progress", "completed", "on-hold")
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  budget: Joi.number().min(0).optional(),
  clientId: Joi.string().pattern(objectIdPattern).optional(),
  responsibleUsers: Joi.array()
    .items(Joi.string().pattern(objectIdPattern))
    .optional(),
}).min(1);
