import React, {useState} from 'react';
import {leaveRoom, state} from '../main';
import use from '../lib/use-state.js';
import swarm from '../lib/swarm.js';
import EnterRoom from './EnterRoom.jsx';
import {gravatarUrl} from '../lib/gravatar';
import {navigate} from '../lib/use-location';
import copyToClipboard from '../lib/copy-to-clipboard';
import signalhub from "../lib/signalhub";


// TODOs:
// -) wire speakers, mod lists to UI

export default function Room({room, roomId}) {
  let myInfo = use(state, 'myInfo');
  let myAudio = use(state, 'myAudio');
  let micOn = myAudio?.active;
  let micMuted = use(state, 'micMuted');
  let soundMuted = use(state, 'soundMuted');
  let speaking = use(state, 'speaking');
  let enteredRooms = use(state, 'enteredRooms');
  let streams = use(swarm, 'remoteStreams');
  let identities = use(state, 'identities');
  let name = room?.name;
  let description = room?.description;


  let [editIdentity, setEditIdentity] = useState(false);

  let [displayName, setDisplayName] = useState(myInfo.displayName);
  let [email, setEmail] = useState(myInfo.email);

  let [showShareInfo, setShowShareInfo] = useState(false);

  let updateInfo = e => {
    e.preventDefault();
    const userInfo = {displayName, email};
    state.set('myInfo', userInfo);
    setEditIdentity(false);
    swarm.hub.broadcast("identity-updates", swarm.myPeerId);
  };

  if (!enteredRooms.has(roomId))
    return <EnterRoom roomId={roomId} name={name} description={description} />;

  return (
    <div className="container">
      {editIdentity && (
        <div className="child">
          <h3 className="font-medium">Profile</h3>
          <br />
          <form onSubmit={updateInfo}>
            <input
              className="rounded placeholder-gray-300 bg-gray-50 w-64"
              type="text"
              placeholder="Display name"
              value={displayName}
              name="display-name"
              onChange={e => {
                setDisplayName(e.target.value);
              }}
            />
            <div className="p-2 text-gray-500 italic">
              {`What's your name?`}
              <span className="text-gray-300"> (optional)</span>
            </div>
            <br />
            <input
              className="rounded placeholder-gray-300 bg-gray-50 w-72"
              type="email"
              placeholder="email@example.com"
              value={email}
              name="email"
              onChange={e => {
                setEmail(e.target.value);
              }}
            />
            <div className="p-2 text-gray-500 italic">
              {`What's your email?`}
              <span className="text-gray-300"> (used for Gravatar)</span>
            </div>
            <button
              onClick={updateInfo}
              className="mt-5 h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline hover:bg-gray-300 mr-2"
            >
              Update Profile
            </button>
            <button
              onClick={() => setEditIdentity(false)}
              className="mt-5 h-12 px-6 text-lg text-black bg-gray-100 rounded-lg focus:shadow-outline hover:bg-gray-300"
            >
              Cancel
            </button>
          </form>
          <br />
          <hr />
        </div>
      )}
      <div className="child">
        <h1>{name}</h1>
        <div className="text-gray-500">{description}</div>

        {/* Stage */}
        <div className="h-40 min-h-full">
          <ol className="flex space-x-4 pt-6">
            {myAudio && (
              <li
                className="flex-col items-center space-y-1"
                style={{cursor: 'pointer'}}
                onClick={() => setEditIdentity(!editIdentity)}
              >
                <div
                  className={
                    speaking.has('me')
                      ? 'human-radius p-1 bg-gray-300'
                      : 'human-radius p-1 bg-white'
                  }
                >
                  <div className="human-radius p-1 bg-white">
                    <img
                      className="human-radius border border-gray-300 bg-gray-300 w-28 h-28"
                      alt="me"
                      src={gravatarUrl(myInfo)}
                    />
                  </div>
                </div>
                <div className="font-medium text-center w-28 m-2 break-words">
                  {myInfo.displayName}
                </div>
              </li>
            )}
            {streams.map(({stream, peerId}) => {
              const peerInfo = identities[peerId] || {id: peerId};
              // console.log('Peer Info for ' + peerId);
              // console.log(peerInfo);
              // console.log(identities);
              return (
                stream && (
                  <li
                    key={peerId}
                    className="flex-col items-center space-y-1"
                    title={peerId}
                  >
                    <div
                      className={
                        speaking.has(peerId)
                          ? 'human-radius p-1 bg-gray-300'
                          : 'human-radius p-1 bg-white'
                      }
                    >
                      <div className="human-radius p-1 bg-white">
                        <img
                          className="human-radius border border-gray-300 bg-gray-300 w-28 h-28"
                          alt={peerId}
                          src={gravatarUrl(peerInfo)}
                        />
                      </div>
                    </div>
                    <span className="font-medium text-center w-28 m-2 break-words">
                      {peerInfo.displayName}
                    </span>
                  </li>
                )
              );
            })}
          </ol>
        </div>

        <h3 className="hidden" style={{marginTop: '80px'}}>
          Audience
        </h3>
        <ol className="hidden flex space-x-4 pt-6">
          <li className="flex-shrink w-24 h-24 ring-yellow-500">
            <img
              className="human-radius border border-gray-300"
              src="img/avatars/sonic.jpg"
            />
          </li>
          <li className="flex-shrink w-24 h-24">
            <img
              className="human-radius border border-gray-300"
              src="img/avatars/gregor.jpg"
            />
          </li>
          <li className="flex-shrink w-24 h-24">
            <img
              className="human-radius border border-gray-300"
              src="img/avatars/christoph.jpg"
            />
          </li>
          <li className="flex-shrink w-24 h-24">
            <img
              className="human-radius border border-gray-300"
              src="img/avatars/tosh.jpg"
            />
          </li>
        </ol>

        <div className="mt-10 navigation">
          <div className="flex">
            <button
              onClick={() => state.set('micMuted', !micMuted)}
              className="h-12 mr-2 px-6 text-lg text-black bg-yellow-200 rounded-lg focus:shadow-outline hover:bg-yellow-300 flex-grow mt-10"
              style={{flex: '1 0 0'}}
            >
              🎙️ {micOn ? (micMuted ? 'Muted' : 'On') : 'Off'}
            </button>

            <button
              onClick={() => state.set('soundMuted', !soundMuted)}
              className="h-12 ml-2 px-6 text-lg text-black bg-yellow-200 rounded-lg focus:shadow-outline hover:bg-yellow-300 flex-grow mt-10"
              style={{flex: '1 0 0'}}
            >
              {soundMuted ? '🔇' : '🔊'} {soundMuted ? 'Off' : 'On'}
            </button>
          </div>

          <br />

          <div className="flex relative">
            {showShareInfo && (
              <span
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '2px',
                  fontSize: '13px',
                }}
              >
                Link copied to clipboard!
              </span>
            )}
            <button
              onClick={() => {
                if (navigate.share) {
                  navigator.share({
                    title: name || 'A Jam room',
                    text: 'Hi, join me in this room on Jam.',
                    url: location.href,
                  });
                } else {
                  copyToClipboard(location.href);
                  setShowShareInfo(true);
                  setTimeout(() => setShowShareInfo(false), 2000);
                }
              }}
              className="h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline hover:bg-gray-300"
            >
              ✉️&nbsp;Share
            </button>

            <button className="hidden h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline hover:bg-gray-300 flex-grow">
              ✋🏽&nbsp;Raise&nbsp;hand
            </button>
          </div>

          <br />
          <br />
          <br />

          <button
            className="h-12 px-6 text-lg text-black bg-gray-200 rounded-lg focus:shadow-outline hover:bg-gray-300"
            onClick={() => leaveRoom(roomId)}
          >
            🚪 Leave quietly
          </button>
        </div>

        <br />
        <br />
        {/*
            TODO: implement concept of stage / audience + raising hands
            hide this for now
        */}
        <div className="hidden">
          <h3 className="pb-6">Raised their hand</h3>

          <div className="p-2 max-w-sm mx-auto flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 human-radius"
                src="/img/avatars/christoph.jpg"
                alt="Sonic"
              />
            </div>
            <div>
              <div className="text-xl font-book text-black">
                Christoph Witzany
              </div>
              <p className="text-gray-500">
                Product, UX, StarCraft, Clojure, …
              </p>
            </div>
          </div>
          <div className="p-2 max-w-sm mx-auto flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 human-radius"
                src="/img/avatars/sonic.jpg"
                alt="Sonic"
              />
            </div>
            <div>
              <div className="text-xl font-book text-black">Thomas Schranz</div>
              <p className="text-gray-500">
                Product, UX, StarCraft, Clojure, …
              </p>
            </div>
          </div>
          <div className="p-2 max-w-sm mx-auto flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                className="h-12 w-12 human-radius"
                src="/img/avatars/gregor.jpg"
                alt="Sonic"
              />
            </div>
            <div>
              <div className="text-xl font-book text-black">
                Gregor Mitscha-Baude
              </div>
              <p className="text-gray-500">
                Product, UX, StarCraft, Clojure, …
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
