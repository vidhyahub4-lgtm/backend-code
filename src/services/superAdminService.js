const Sidebar = require("../models/sidebar");
const { uploadImageToCloudflare } = require("./cloudflare.service");
const Board = require("../models/board");
const InstituteType = require('../models/instituteType');
const State = require('../models/state');
const City = require('../models/city');
const Class = require('../models/class');
const Section = require('../models/section');
const School = require('../models/schoolModels');

const superAdminService = {
  createSidebar: async ({ text, link, image, permission, children, order }) => {
    // if (!image) {
    //   throw new Error("Sidebar image is required");
    // }

    // 2. Upload image to Cloudflare
    // const cloudflareImage = await uploadImageToCloudflare(file);

    // 3. Get Cloudflare image URL
    // const imageUrl = cloudflareImage.variants?.[0];
    const sidebar = new Sidebar({
      text,
      link,
      icon: image,
      permission,
      children: children || [],
      order,
    });
    return await sidebar.save();
  },

  createBoard: async ({ board, startMonth , userId}) => {
    const newBoard = new Board({
      boardName:board,
      startMonth,
      createdBy:userId,
    });
    return await newBoard.save();
  },
  getBoard: async () => {
    return await Board.find();
  },

  createInstituteType: async ({ instituteType, userId }) => {
    const newInstituteType = new InstituteType({
      instituteType,
      createdBy: userId,
    });
    return await newInstituteType.save();
  },

  getInstituteType: async () => {
    return await InstituteType.find();
  },

  createState: async ({ stateName, userId }) => {
    const newState = new State({
      stateName,
      createdBy: userId,
    });
    return await newState.save();
  },

  getState: async () => {
    return await State.find();
  },

  createCity: async ({ cityName, stateId,userId, pinCode }) => {
    const newCity = new City({
      cityName,
      stateId,
      createdBy: userId,
      pinCode,
    });
    return await newCity.save();
  },

  getCity: async () => {
    return await City.find().populate('stateId', 'State').select('-createdAt -updatedAt');
  },

  createClass: async ({ className, classInWord, userId }) => {
    const newClass = new Class({
      className,
      classInWord,
      createdBy: userId,
      
    });
    return await newClass.save();
  },

  getClass: async () => {
    return await Class.find().select('-createdAt -updatedAt');
  },

  createSection: async ({ sectionName, classId, userId, Maxlimit }) => {
    const newSection = new Section({
      sectionName,
      classId,
      createdBy: userId,
      Maxlimit,
    });
    return await newSection.save();
  },

  getSection: async () => {
    return await Section.find().populate('classId', 'className').select('-createdAt -updatedAt');
  },


  createSchool: async ({ schName, schAdd, schInfo, city, state, schoolCode, websiteUrl, contact1, contact2, email, admin, selectBoard, instituteType, schLogo }) => {
    const newSchool = new School({
      schName, schAdd, schInfo, city, state, schoolCode, websiteUrl, contact1, contact2, email, admin, selectBoard, instituteType, schLogo
    });
    return await newSchool.save();
  }

};

module.exports = superAdminService;
