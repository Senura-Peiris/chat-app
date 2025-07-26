import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Bell } from "lucide-react";

function Chat({ socket }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState(null);
  const [friendEmail, setFriendEmail] = useState("");
  const [friends, setFriends] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const notifPanelRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    } else {
      axios
        .get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUser(res.data.user);
          fetchFriends(res.data.user._id, token);
          fetchChats(res.data.user._id, token);
        })
        .catch((err) => {
          console.error("Auth error:", err);
          navigate("/");
        });
    }
  }, [navigate]);

  useEffect(() => {
    if (user && socket) {
      socket.emit("register", user._id);

      socket.on("receive_invite", ({ from }) => {
        setIncomingInvite(from);
        // Optionally open notification panel automatically:
        // setNotifPanelOpen(true);
      });

      socket.on("invite_accepted", ({ by }) => {
        alert(`Your chat invite was accepted by ${by.username}`);
        setActiveTab("privateMessages");
        fetchChats(user._id, localStorage.getItem("token"));
      });

      return () => {
        socket.off("receive_invite");
        socket.off("invite_accepted");
      };
    }
  }, [user, socket]);

  const fetchFriends = async (userId, token) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/friends/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(res.data.friends);
    } catch (err) {
      console.error("Fetch friends error:", err);
    }
  };

  const fetchChats = async (userId, token) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chats/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChats(res.data.chats);
    } catch (err) {
      console.error("Fetch chats error:", err);
    }
  };

  const inviteFriend = async () => {
    if (!friendEmail || !user) return;
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        "http://localhost:5000/api/friends/invite",
        {
          email: friendEmail,
          senderEmail: user.email,
          senderName: user.username,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Invite sent to ${friendEmail}`);
      setFriendEmail("");
    } catch (err) {
      alert("Failed to send invite");
      console.error(err);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/users/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const filtered = res.data.users.filter((u) => u._id !== user._id);
      setSearchResults(filtered);
    } catch (err) {
      console.error("User search error:", err);
    }
  };

  const startChatWithUser = async (friendId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/users/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const friend = res.data.user;
      socket.emit("send_invite", {
        from: { id: user._id, username: user.username },
        to: friend._id,
      });

      alert(`Invite sent to ${friend.username}`);
    } catch (err) {
      console.error("Start chat error:", err);
      alert("Could not send chat invite.");
    }
  };

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close notification panel if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(event.target) &&
        !event.target.closest("button[aria-label='Notifications']")
      ) {
        setNotifPanelOpen(false);
      }
    };

    if (notifPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifPanelOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-gray-800 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2
            className="text-3xl font-bold text-blue-400 relative z-10 cursor-pointer"
            style={{
              animation: "glow 2s ease-in-out infinite",
              textShadow:
                "0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6",
            }}
          >
            Chatme
          </h2>

          {user && (
            <div className="relative flex items-center space-x-3" ref={dropdownRef}>
              <img
                src={`http://localhost:5000/uploads/${user.profileImage}`}
                alt="profile"
                className="w-10 h-10 rounded-full cursor-pointer object-cover border-2 border-blue-500"
                onClick={toggleDropdown}
              />

              {/* Notification Bell Icon */}
              <button
                className="relative text-white hover:text-blue-400 focus:outline-none"
                aria-label="Notifications"
                onClick={() => setNotifPanelOpen((prev) => !prev)}
                style={{ display: "flex", alignItems: "center" }}
              >
                <Bell className="w-6 h-6" />
                {/* Red dot if there is an incoming invite */}
                {incomingInvite && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600"></span>
                )}
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-12 w-40 bg-white text-black rounded shadow-lg p-2 z-10">
                  <p className="text-sm font-semibold mb-2">{user.username}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-red-600 hover:bg-red-100 rounded px-2 py-1"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="flex flex-col flex-grow p-4 space-y-4">
          {["inviteFriends", "groupCalls", "privateMessages"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left px-3 py-2 rounded ${
                activeTab === tab ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {tab === "inviteFriends"
                ? "Invite Friends"
                : tab === "groupCalls"
                ? "Group Calls"
                : "Private Messages"}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow bg-gray-900 p-6 overflow-auto">
        {activeTab === null && user && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome, {user.username}!</h1>
            <p className="text-gray-400 text-lg">Start chatting on Chatme 🚀</p>
          </div>
        )}

        {activeTab === "inviteFriends" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Invite or Chat with Friends</h1>

            <div className="mb-4 flex">
              <input
                type="email"
                placeholder="Friend's email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className="p-2 rounded-l text-black flex-grow bg-white"
              />
              <button
                onClick={inviteFriend}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r"
              >
                Send Invite
              </button>
            </div>

            <input
              type="text"
              placeholder="Search registered users"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="p-2 rounded w-full mb-4 text-black bg-white"
            />

            {searchResults.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl mb-2">Search Results</h2>
                <ul className="space-y-2">
                  {searchResults.map((result) => (
                    <li
                      key={result._id}
                      className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 flex items-center space-x-3"
                      onClick={() => startChatWithUser(result._id)}
                    >
                      <img
                        src={`http://localhost:5000/uploads/${result.profileImage}`}
                        alt={`${result.username} profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{result.username}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {friends.length > 0 && (
              <div>
                <h2 className="text-xl mb-2">Your Friends</h2>
                <ul className="space-y-2">
                  {friends.map((friend) => (
                    <li key={friend._id} className="bg-gray-800 p-2 rounded flex items-center space-x-3">
                      <img
                        src={`http://localhost:5000/uploads/${friend.profileImage}`}
                        alt={`${friend.username} profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span>{friend.username}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "groupCalls" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Group Calls</h1>
            {/* Placeholder for group calls content */}
            <p className="text-gray-400">Group calls functionality coming soon.</p>
          </div>
        )}

        {activeTab === "privateMessages" && (
          <div>
            <h1 className="text-3xl font-bold mb-4">Private Messages</h1>
            {chats.length === 0 ? (
              <p className="text-gray-400">No private messages yet.</p>
            ) : (
              <ul className="space-y-2">
                {chats.map((chat) => (
                  <li
                    key={chat._id}
                    className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700 flex items-center space-x-3"
                    // Add your onClick to open chat here
                  >
                    <img
                      src={`http://localhost:5000/uploads/${chat.friend.profileImage}`}
                      alt={`${chat.friend.username} profile`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span>{chat.friend.username}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>

      {/* Notification Panel */}
      <div
        ref={notifPanelRef}
        className={`fixed top-0 right-0 h-full w-80 bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 flex flex-col ${
          notifPanelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button
            onClick={() => setNotifPanelOpen(false)}
            className="text-gray-400 hover:text-white"
            aria-label="Close notifications"
          >
            ✕
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {/* Incoming invites */}
          {incomingInvite ? (
            <div className="bg-gray-700 rounded p-3">
              <p className="mb-2">
                <strong>{incomingInvite.username}</strong> invited you to chat.
              </p>
              <button
                onClick={() => {
                  socket.emit("accept_invite", {
                    from: incomingInvite.id,
                    to: { id: user._id, username: user.username },
                  });
                  setIncomingInvite(null);
                  setActiveTab("privateMessages");
                  setNotifPanelOpen(false);
                }}
                className="bg-blue-600 px-3 py-1 rounded mr-2 hover:bg-blue-700"
              >
                Accept
              </button>
              <button
                onClick={() => {
                  setIncomingInvite(null);
                }}
                className="bg-gray-600 px-3 py-1 rounded hover:bg-gray-500"
              >
                Decline
              </button>
            </div>
          ) : (
            <p className="text-gray-400">No new invitations.</p>
          )}
          {/* Additional notifications can go here */}
        </div>
      </div>

      {/* Glow animation */}
      <style>{`
        @keyframes glow {
          0% { text-shadow: 0 0 5px #3b82f6; }
          50% { text-shadow: 0 0 20px #3b82f6, 0 0 30px #60a5fa; }
          100% { text-shadow: 0 0 5px #3b82f6; }
        }
      `}</style>
    </div>
  );
}

export default Chat;
