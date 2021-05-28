import nacl from 'tweetnacl';
import {set} from 'use-minimal-state';
import {StoredState} from '../lib/local-storage';
import {importLegacyIdentity} from '../lib/migrations';
import {encode, decode} from '../lib/identity-utils';
import {putOrPost} from './backend';
import {use} from '../lib/state-tree';

export {Identity, setCurrentIdentity, importRoomIdentity};

const identities = StoredState('identities', () => {
  const _default = importLegacyIdentity() || createIdentity();
  return {_default};
});

function Identity() {
  postInitialIdentity(identities._default);
  const hasPosted = new Set();

  return function Identity({roomId}) {
    let defaultIdentity = use(identities, '_default');
    let roomIdentity = use(identities, roomId);

    if (roomIdentity !== undefined && !hasPosted.has(roomId)) {
      hasPosted.add(roomId);
      postInitialIdentity(roomIdentity);
    }

    let myIdentity = roomIdentity ?? defaultIdentity;
    let myId = myIdentity.publicKey;
    return {myId, myIdentity};
  };
}

function postInitialIdentity(identity) {
  return putOrPost(
    {myIdentity: identity},
    `/identities/${identity.publicKey}`,
    identity.info
  );
}

function setCurrentIdentity({roomId}, valueOrFunction) {
  let identityKey = identities[roomId] ? roomId : '_default';
  set(identities, identityKey, valueOrFunction);
}

function importRoomIdentity(roomId, roomIdentity, keys) {
  if (identities[roomId]) return;
  if (roomIdentity) {
    if (keys && keys[roomIdentity.id]) {
      if (keys[roomIdentity.id].seed) {
        addIdentity(
          roomId,
          createIdentityFromSeed(roomIdentity, keys[roomIdentity.id].seed)
        );
      } else {
        addIdentity(
          roomId,
          createIdentityFromSeed(roomIdentity, keys[roomIdentity.id].secretKey)
        );
      }
    } else {
      addIdentity(roomId, createIdentity(roomIdentity));
    }
  }
}

function createIdentityFromSecretKey(info, privatekeyBase64) {
  const keypair = nacl.sign.keyPair.fromSecretKey(decode(privatekeyBase64));
  return createIdentityFromKeypair(info, keypair);
}

function createIdentityFromSeed(info, seedString) {
  const keypair = nacl.sign.keyPair.fromSeed(
    nacl.hash(new TextEncoder().encode(seedString))
  );
  return createIdentityFromKeypair(info, keypair);
}

function createIdentity(info) {
  const keypair = nacl.sign.keyPair();
  return createIdentityFromKeypair(info, keypair);
}

function createIdentityFromKeypair(info, keypair) {
  let publicKey = encode(keypair.publicKey);
  let secretKey = encode(keypair.secretKey);
  return {
    publicKey,
    secretKey,
    info: {
      ...info,
      id: publicKey,
    },
  };
}

function addIdentity(key, identity) {
  set(identities, key, identity);
}
