import { Request, Response } from "express"
export const getNotify = async (req: Request, res: Response) => {
  try {
    const {
      
    } = req.params
    const header = req.headers
  }catch(error){
    return res.status(500).json({error: error})
  }
}