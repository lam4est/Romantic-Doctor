import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes } from '@fortawesome/free-solid-svg-icons';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white w-80 h-96 rounded-xl shadow-lg flex flex-col">
          <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hỗ trợ trực tuyến</h3>
            <button onClick={() => setIsOpen(false)}>
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-sm text-gray-500">Chào bạn! Chúng tôi có thể giúp gì?</p>
          </div>
          <div className="p-2 border-t">
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-1 text-sm focus:outline-none"
              placeholder="Nhập tin nhắn..."
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faComments} />
          Chat
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
