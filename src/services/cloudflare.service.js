const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const {
  accountId,
  apiToken
} = require("../config/cloudflare");

const uploadImageToCloudflare = async (file) => {
  try {
    const form = new FormData();

    form.append(
      "file",
      fs.createReadStream(file.path)
    );

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
      form,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          ...form.getHeaders()
        }
      }
    );

    return response.data.result;

  } catch (error) {

    console.error(
      "Cloudflare upload error:",
      error.response?.data || error.message
    );

    throw new Error("Failed to upload image to Cloudflare");
  }
};

module.exports = {
  uploadImageToCloudflare
};