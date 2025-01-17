import express from 'express';
import Database from "./database.js";
import cors from 'cors';

const port = process.env.API_PORT;
if (!port) {
    console.log("The API_PORT environment variable is required");
    process.exit(1);
}

const database = new Database();

const server = express();
server.use(cors());

server.get('/blocksBetweenHeights', async (request, response) => {
    if (!request.query.startHeight) {
        response.status(400).send("missing parameter: startHeight");
        return;
    }
    if (!request.query.endHeight) {
        response.status(400).send("missing parameter: endHeight");
        return;
    }

    try {
        await database.withClient(async client => {
            const startHeight = parseInt(request.query.startHeight as string);
            const endHeight = parseInt(request.query.endHeight as string);
            const blocksAndEdges = await database.getBlocksAndEdgesAndHeightGroups(client, startHeight, endHeight);
            response.send(JSON.stringify(blocksAndEdges));
        });
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.get('/head', async (request, response) => {
    if (!request.query.heightDifference) {
        response.status(400).send("missing parameter: heightDifference");
        return;
    }

    try {
        await database.withClient(async client => {
            const heightDifference = parseInt(request.query.heightDifference as string);
            const endHeight = await database.getMaxHeight(client);
            let startHeight = endHeight - heightDifference;
            if (startHeight < 0) {
                startHeight = 0;
            }
            const blocksAndEdges = await database.getBlocksAndEdgesAndHeightGroups(client, startHeight, endHeight);
            response.send(JSON.stringify(blocksAndEdges));
        });
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.get('/blockHash', async (request, response) => {
    if (!request.query.blockHash) {
        response.status(400).send("missing parameter: blockHash");
        return;
    }
    if (!request.query.heightDifference) {
        response.status(400).send("missing parameter: heightDifference");
        return;
    }

    try {
        await database.withClient(async client => {
            const height = await database.getBlockHeight(client, request.query.blockHash as string);
            const heightDifference = parseInt(request.query.heightDifference as string);
            let startHeight = height - heightDifference;
            if (startHeight < 0) {
                startHeight = 0;
            }
            const endHeight = height + heightDifference;
            const blocksAndEdges = await database.getBlocksAndEdgesAndHeightGroups(client, startHeight, endHeight);
            response.send(JSON.stringify(blocksAndEdges));
        });
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.get('/blockHashesByIds', async (request, response) =>{
    if (!request.query.blockIds) {
        response.status(400).send("missing parameter: blockIds");
        return;
    }

    try {
        await database.withClient(async client => {
            const blockIdsString = request.query.blockIds as string;
            const blockIdStrings = blockIdsString.split(",");
            const blockIds = blockIdStrings.map(id => parseInt(id));
            const hashesByIds = await database.getBlockHashesByIds(client, blockIds);

            response.send(JSON.stringify(hashesByIds));
        });
        return;
    } catch (error) {
        response.status(400).send(`invalid input: ${error}`);
        return;
    }
});

server.listen(port, () => {
    console.log(`API server listening on port ${port}...`);
});
