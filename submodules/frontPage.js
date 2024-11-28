function frontPage(req,res) {
    res.status(200).json({ message: "Hello from frontPage" });
}

const requestHandler = async (req, res) => {
    try {
      await frontPage(req, res);
      if (!res.headersSent) {
        res.status(200).json({ message: "handler completed without sending a response" });
      }
    } catch (error) {
      console.error("Error occurred while handling request:", error);
      res.status(500).send("Internal Server Error");
    }
  };

export {frontPage};