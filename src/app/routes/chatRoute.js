module.exports = function(app){
    const chat = require('../controllers/chatController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/chatrooms', jwtMiddleware, chat.postChatroom);
    app.delete('/chatrooms/:chatroomIdx/no-messages',jwtMiddleware,chat.deleteEmptyChatroom);
    app.get('/chatrooms',jwtMiddleware,chat.getAllChatroom);
    app.patch('/chatrooms',jwtMiddleware,chat.deleteChatroom);

    app.get('/chatrooms/:chatroomIdx/top-item',jwtMiddleware,chat.getChatroomItem);
    app.get('/chatrooms/:chatroomIdx/detail',jwtMiddleware,chat.getChatroomDetail);

    app.post('/chatrooms/messages',jwtMiddleware,chat.postMessage);
};
