function handler(req,res) {
    res.status(200).json({ message: "Hello from handler" });
}

export {handler};