import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

console.log("Starting Server")
const app = express();
app.use(cors()); //Enable CORS
app.use(express.json()); //Parse incoming requests as JSON payloads

const PORT = process.env.PORT || 3000; //Server Listen port. Check env variable for PORT else default to 3000

//Root Path
app.get('/', (req: Request, res: Response)=> {
    console.log("Root Path Called");
    res.status(200).json({message: "Backed Server is Active!"});
});

//
app.get('/analyze_url', (req: Request, res: Response) => {
    const url_to_analyze = req.query.url as string | undefined;

    if(!url_to_analyze){
        console.log("URL Query Parameter not passed!")
        res.status(400).json({ error: "URL Query parameter required!"});
        return;
    }

    console.log(`Analyze URL: ${url_to_analyze}`);

    res.status(200).json({
        message: 'URL Analysis Request Received',
        requestedUrl: url_to_analyze
    });
    return;
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
    console.log(`Backend server is listening on http://localhost:${PORT}`);
});