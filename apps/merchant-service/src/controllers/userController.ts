import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/middleware";
import { userService, UserServiceError } from "../services/userService";
import {
  CreateStoreForUserPayload,
  UpdateMerchantProfileAddressPayload,
} from "../types/user.types";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error ?? "Unknown error");

export const getMerchantProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await userService.getMerchantProfile({ userSub: req.user?.sub });
    return res.json(result);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("Error fetching merchant profile:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateMerchantProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await userService.updateMerchantProfile({
      profileDataString: req.body?.profileData as string | undefined,
      files: req.files as Express.Multer.File[] | undefined,
    });
    return res.json(result);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("Update Merchant Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateMerchantAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await userService.updateMerchantAddress({
      userSub: req.user?.sub,
      addressId: req.params.id,
      payload: req.body as UpdateMerchantProfileAddressPayload,
    });

    return res.json(result);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createStoreForUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body as CreateStoreForUserPayload;
    const result = await userService.createStoreForUser(payload);
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return res.status(error.statusCode).json(error.body);
    }

    console.error("Error creating store for user:", error);
    return res.status(400).json({ error: errorMessage(error) });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const deleted = await userService.deleteUser({ id: req.params.id });
    if (deleted) {
      return res.status(204).send();
    }
    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
