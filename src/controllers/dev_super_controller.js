const dev_super_service = require('../services/dev_super_service')
const asyncHandler = require("../errorHandlers/asyncHandler");
const AppError = require("../utils/appError");
const dev_super_controller={
  createSession  :asyncHandler(async(req, res)=>{
    const { session} = req.body;
    const result = await dev_super_service.createSession({session});
    res.status(201).json({
      success: true,
      message: "New Session created successfully",
      session: result,
    });
  }),

  getSession: asyncHandler( async( req, res)=>{
    const result = await dev_super_service.getAllSession()
    res.status(200).json({
      success: true,
      message: "Get all session successfully",
      session: result,
    });
  })

}


module.exports = dev_super_controller