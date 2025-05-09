import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const ChatWidget = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Chào bạn! Chúng tôi có thể giúp gì?' }
  ]);

  const bottomRef = useRef(null);

  useEffect(() => {
    const sessionKey = localStorage.getItem('chatSessionKey');
    if (!sessionKey) {
      fetch('http://localhost:4000/api/user/start-chat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.sessionKey) {
            localStorage.setItem('chatSessionKey', data.sessionKey);
          }
        })
        .catch(err => console.error('Lỗi khi khởi tạo phiên chat:', err));
    }
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput(''); // Reset input sau khi gửi

    const sessionKey = localStorage.getItem('chatSessionKey');

    try {
      const response = await fetch('http://localhost:4000/api/user/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, sessionKey })
      });

      const data = await response.json();
      const botReply = data.success ? data.reply : data.message || 'Xin lỗi, hệ thống đang bận.';
      setMessages([...newMessages, { sender: 'bot', text: botReply }]);
    } catch (error) {
      console.log('Frontend error:', error.message);
      setMessages([...newMessages, { sender: 'bot', text: 'Lỗi kết nối đến máy chủ!' }]);
    }
  }, [input, messages]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const parseDoctorJSON = (text) => {
    try {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (!match || !match[1]) return null;
  
      const parsed = JSON.parse(match[1].trim());
      return parsed?.doctors || null;
    } catch (err) {
      console.error('Lỗi khi parse JSON bác sĩ:', err);
      return null;
    }
  };  

  const DoctorCard = React.memo(({ doctor }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-2">
      {doctor.image && (
        <img
          src={doctor.image}
          alt={`Ảnh bác sĩ ${doctor.name}`}
          className="w-full h-40 object-contain rounded-md mb-2"
        />
      )}
      <h4 className="text-lg font-semibold text-gray-800">{doctor.name}</h4>
      <p className="text-sm text-gray-600"><span className="font-medium">Chuyên khoa:</span> {doctor.speciality}</p>
      <p className="text-sm text-gray-600"><span className="font-medium">Kinh nghiệm:</span> {doctor.experience}</p>
      <p className="text-sm text-gray-600">
        <span className="font-medium">Địa chỉ:</span> {doctor.address.line1}, {doctor.address.line2}
      </p>
      {doctor.fee && (
        <p className="text-sm text-gray-600"><span className="font-medium">Phí khám:</span> ${doctor.fee}</p>
      )}
      <button
        onClick={() => navigate(`/appointment/${doctor._id}`)}
        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
      >
        Đặt lịch hẹn
      </button>
    </div>
  ));
  

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white w-96 h-[500px] rounded-xl shadow-lg flex flex-col">
          <div className="bg-blue-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="text-lg font-semibold">Hỗ trợ trực tuyến</h3>
            <button onClick={() => setIsOpen(false)}>
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm">
            {messages.map((msg, idx) => {
              const doctors = msg.sender === 'bot' ? parseDoctorJSON(msg.text) : null;

              return (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {doctors ? (
                    <div className="max-w-[80%] w-fit">
                      {doctors.map((doctor, i) => (
                        <DoctorCard key={i} doctor={doctor} />
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words text-sm
                        ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}
                        max-w-[80%] w-fit`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button onClick={sendMessage} className="text-blue-600 hover:text-blue-800">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
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
