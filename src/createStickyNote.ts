// Using miro-api client library
import {Board, MiroApi, ShapeItem, StickyNoteItem} from "@mirohq/miro-api";


const oauthAccessToken = 'eyJtaXJvLm9yaWdpbiI6ImV1MDEifQ_SIHbKw7lIHVQZbAAD5XvrgZ3T5Q';

const api = new MiroApi(oauthAccessToken);

const STICKY_WIDTH = 200;
const DAY_HEIGHT = 200;
const DAY_OFFSET = 300;
const DATE_WIDTH = 150;
const MILLI_SECOND_A_DAY = 24 * 60 * 60 * 1000;

type Origin = {
    x: number,
    y: number,
    date: Date
}

const getToday = ():Date => new Date(new Date().toLocaleDateString());
const getDayDiff = (from: Date, to: Date): number => {
    return (to.getTime() - from.getTime()) / MILLI_SECOND_A_DAY;
}

const getOrigin = async (board: Board): Promise<Origin> => {
    const shapeItems = await board.getAllItems({
        type: 'shape'
    });

    for await (const item of shapeItems) {
        const shapeItem = item as ShapeItem;
        if(shapeItem.data?.shape === 'octagon' &&
        shapeItem.data.content?.startsWith("<p>origin")) {
            const date = new Date(shapeItem.data.content.slice("<p>origin".length).replace('</p>', ""))
            return {
                x: shapeItem.position?.x ?? 0,
                y: shapeItem.position?.y ?? 0,
                date,
            }
        }
    }
    const today = new Date().toLocaleDateString()
    await board.createShapeItem({
        data: {shape: 'octagon', content: `origin${today}`},
        geometry: {height: 100, width: 100}
    })
    return {
        x: 0,
        y: 0,
        date: new Date()
    }
};


const getEndOfDate = async (board: Board, date: Date, origin: Origin): Promise<ShapeItem> => {
    const shapeItems = await board.getAllItems({
        type: 'shape'
    });

    const eodText = `EOD${date.toLocaleDateString()}`;

    for await (const item of shapeItems) {
        const shapeItem = item as ShapeItem;
        if(shapeItem.data?.shape === 'right_arrow' &&
            shapeItem.data.content === eodText) {
            return shapeItem;
        }
    }

    await board.createTextItem({
        data: {content: date.toLocaleDateString()},
        style: {fontSize: '36'},
        position: {x: origin.x - DATE_WIDTH, y:origin.y + DAY_OFFSET+ getDayDiff(origin.date, date) * DAY_HEIGHT },
    });

    return await board.createShapeItem({
        data: {shape: 'right_arrow', content: eodText},
        position: {x: origin.x, y:origin.y + DAY_OFFSET+ getDayDiff(origin.date, date) * DAY_HEIGHT },
        geometry: {height: 100, width: 100}
    });
};

const postPostItAndLink = async (board: Board, content: string, link: string): Promise<StickyNoteItem | null> => {
    const today = getToday();
    const origin = await getOrigin(board);
    const endOfDateArrow = await getEndOfDate(board, today, origin);
    const stickyPosition = {
        x: endOfDateArrow.position?.x ?? origin.x,
        y: endOfDateArrow.position?.y ?? origin.y + DAY_OFFSET,
    }
    await Promise.all([
        board.createStickyNoteItem({position: stickyPosition, data: {content}}),
        board.createTextItem({
            position: {
                x: stickyPosition.x,
                y: stickyPosition.y + 100
            },
            data:{
                content: `<a href="${link}">Link</a>`
            }
        }),
        endOfDateArrow.update({position:{
                x: (endOfDateArrow.position?.x ?? origin.x) + STICKY_WIDTH,
                y: (endOfDateArrow.position?.y ?? origin.y + DAY_OFFSET),
            }})
    ]);
    return null;
};

export const postPost = async (boardId: string, message: string, link: string) => {
    const board = await api.getBoard(boardId)
    await postPostItAndLink(board, message, link)
};


