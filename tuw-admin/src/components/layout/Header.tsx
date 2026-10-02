'use client';

import React, { useState } from 'react';
import { Search, CirclePlus, Bell, Menu, X } from 'lucide-react';

interface HeaderProps {
  pageTitle?: string;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function Header({
  pageTitle = 'Home',
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="topBar">
      <div className="topBarLeft">
        <button
          type="button"
          className="mobileMenuBtn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="pageTitle">{pageTitle}</h1>
      </div>

      {/* Search Bar */}
      <div className="searchContainer">
        <Search className="searchIcon" />
        <input
          type="text"
          placeholder="Search anything"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="searchInput"
        />
        <CirclePlus className="searchPlusIcon" />
      </div>

      {/* Actions & Profile */}
      <div className="topBarRight">
        <div className="actionIcons">
          {/* AI Bot Button */}
          <button
            type="button"
            className="aiBotBtn"
            aria-label="Storeflow AI Assistant"
            title="Storeflow AI Assistant"
            onClick={() => alert('Storeflow AI Assistant activated')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="6" width="18" height="13" rx="4" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="8.5" cy="12.5" r="1.6" fill="#FFFFFF" />
              <circle cx="15.5" cy="12.5" r="1.6" fill="#FFFFFF" />
              <path d="M12 2V6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="2" r="1" fill="#C6EAA0" />
              <path d="M9.5 16C10.2 16.8 11 17 12 17C13 17 13.8 16.8 14.5 16" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M1 12H3" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <path d="M21 12H23" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            className="notificationBtn"
            aria-label="Notifications"
            title="2 Notifications"
            onClick={() => alert('Notifications')}
          >
            <Bell size={20} />
            <span className="notificationBadge">2</span>
          </button>
        </div>

        {/* User Portrait */}
        <div className="userProfile" title="Urvil Kargathala">
          <div className="avatarCodeWrapper">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="20" fill="url(#adminUserAvatarBg)" />
              <defs>
                <linearGradient id="adminUserAvatarBg" x1="0" y1="0" x2="40" y2="40">
                  <stop offset="0%" stopColor="#F5DFB8" />
                  <stop offset="100%" stopColor="#D4A76A" />
                </linearGradient>
                <linearGradient id="adminUserHairGrad" x1="10" y1="5" x2="30" y2="35">
                  <stop offset="0%" stopColor="#6C4123" />
                  <stop offset="100%" stopColor="#4A2810" />
                </linearGradient>
              </defs>
              <path d="M10 22C8 14 12 7 20 7C28 7 32 14 30 22C31 28 30 35 30 35H10C10 35 9 28 10 22Z" fill="url(#adminUserHairGrad)" />
              <path d="M18 25V30H22V25H18Z" fill="#F0C5A0" />
              <path d="M14 30C14 30 17 33 20 33C23 33 26 30 26 30L29 40H11L14 30Z" fill="#2C4E4B" />
              <ellipse cx="20" cy="19" rx="6.5" ry="7.5" fill="#FCD9B8" />
              <path d="M13 16C14 12 17 9 20 9C23 9 26 11 27 15C25 14 22 13 19 14C16 15 14 17 13 16Z" fill="url(#adminUserHairGrad)" />
              <path d="M13 16C12.5 19 12 24 13.5 27C14.5 24 14.5 20 15 18L13 16Z" fill="url(#adminUserHairGrad)" />
              <path d="M27 15C27.5 19 28 24 26.5 27C25.5 24 25.5 20 25 18L27 15Z" fill="url(#adminUserHairGrad)" />
              <ellipse cx="17.8" cy="18.5" rx="0.9" ry="1.1" fill="#3D200E" />
              <ellipse cx="22.2" cy="18.5" rx="0.9" ry="1.1" fill="#3D200E" />
              <path d="M16.8 16.8C17.5 16.4 18.5 16.5 19 16.8" stroke="#5A341A" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M21 16.8C21.5 16.5 22.5 16.4 23.2 16.8" stroke="#5A341A" strokeWidth="0.8" strokeLinecap="round" />
              <path d="M18.8 22.2C19.4 22.8 20.6 22.8 21.2 22.2" stroke="#B85C43" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="userInfo">
            <span className="userName">Urvil Kargathala</span>
            <span className="userRole">Store Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
}
