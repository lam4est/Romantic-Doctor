import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComments, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Chào bạn! Chúng tôi có thể giúp gì?' }
  ]);

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
          } else {
            console.error('Không thể khởi tạo phiên chat.');
          }
        })
        .catch(err => console.error('Lỗi khi khởi tạo phiên chat:', err));
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);

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

    setInput('');
  }, [input, messages]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') sendMessage();
  }, [sendMessage]);

  const parseDoctorInfo = (text) => {
    if (!text || typeof text !== 'string' || !text.includes('*   **Bác sĩ')) return null;
    const doctors = [];
    const lines = text.split('\n');
    let introText = '';
    let outroText = '';
    let currentDoctor = null;
    let doctorStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('*   **Bác sĩ')) {
        if (currentDoctor) doctors.push(currentDoctor);
        doctorStartIndex = i;
        const nameMatch = line.match(/\*   \*\*Bác sĩ (.*?):\*\*/);
        currentDoctor = { name: nameMatch ? nameMatch[1].trim() : '' };
      } else if (doctorStartIndex === -1) {
        introText += (introText ? '\n' : '') + line;
      } else if (currentDoctor && line.startsWith('*   **')) {
        if (line.includes('**Chuyên khoa:**')) {
          currentDoctor.specialty = line.replace('*   **Chuyên khoa:** ', '').trim();
        } else if (line.includes('**Kinh nghiệm:**')) {
          currentDoctor.experience = line.replace('*   **Kinh nghiệm:** ', '').trim();
        } else if (line.includes('**Địa chỉ:**')) {
          currentDoctor.address = line.replace('*   **Địa chỉ:** ', '').trim();
        } else if (line.includes('**Phí khám:**')) {
          currentDoctor.fee = line.replace('*   **Phí khám:** ', '').trim();
        } else if (line.includes('**Hình ảnh:**')) {
          const markdownImage = line.replace('*   **Hình ảnh:** ', '').trim();
          const match = markdownImage.match(/\[(.*?)\]\((.*?)\)/);
          currentDoctor.image = match ? match[2] : markdownImage;
        }
      } else if (currentDoctor && !line.startsWith('*') && line) {
        if (doctors.length === 0 || !doctors.includes(currentDoctor)) {
          doctors.push(currentDoctor);
        }
        outroText += (outroText ? '\n' : '') + line;
      }
    }

    if (currentDoctor && !doctors.includes(currentDoctor)) {
      doctors.push(currentDoctor);
    }

    return doctors.length > 0 ? { introText: introText.trim(), doctors, outroText: outroText.trim() } : null;
  };

  const DoctorCard = React.memo(({ doctor }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-2">
      {doctor.image && (
        <img
          src={doctor.image}
          alt={`Ảnh bác sĩ ${doctor.name}`}
          className="w-full h-40 object-cover rounded-md mb-2"
        />
      )}
      <h4 className="text-lg font-semibold text-gray-800">{doctor.name}</h4>
      <p className="text-sm text-gray-600"><span className="font-medium">Chuyên khoa:</span> {doctor.specialty}</p>
      <p className="text-sm text-gray-600"><span className="font-medium">Kinh nghiệm:</span> {doctor.experience}</p>
      <p className="text-sm text-gray-600"><span className="font-medium">Địa chỉ:</span> {doctor.address}</p>
      {doctor.fee && (
        <p className="text-sm text-gray-600"><span className="font-medium">Phí khám:</span> ${doctor.fee}</p>
      )}
      <button
        onClick={() => setInput(`Tôi muốn đặt lịch với bác sĩ ${doctor.name}`)}
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
              const doctorInfo = msg.sender === 'bot' ? parseDoctorInfo(msg.text) : null;

              return (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {doctorInfo ? (
                    <div className="max-w-[80%] w-fit">
                      {doctorInfo.introText && (
                        <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none shadow-sm mb-2 whitespace-pre-wrap break-words">
                          {doctorInfo.introText}
                        </div>
                      )}
                      {doctorInfo.doctors.map((doctor, i) => (
                        <DoctorCard key={i} doctor={doctor} />
                      ))}
                      {doctorInfo.outroText && (
                        <div className="px-4 py-2 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none shadow-sm mt-2 whitespace-pre-wrap break-words">
                          {doctorInfo.outroText}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words
                        ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}
                        max-w-[80%] w-fit`}
                    >
                      {msg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-2 border-t flex gap-2 items-center">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-1 text-sm focus:outline-none"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
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
