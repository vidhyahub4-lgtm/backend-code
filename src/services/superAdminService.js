const Sidebar = require("../models/sidebar");
const { uploadImageToCloudflare } = require("./cloudflare.service");

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
};

module.exports = superAdminService;
