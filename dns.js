'use strict'
/* eslint-disable no-console */

/*
 * Listener Node
 */

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const Node = require('./p2p_node')
const pull = require('pull-stream')
const series = require('async/series')

function startListener() {
    let listenerID
    let listenerNode

    series([
        cb => {
            PeerId.createFromJSON(require('./id'), (err, id) => {
                if (err) return cb(err)

                listenerID = id;
                cb()
            })
        },
        cb => {
            const listenerPeerInfo = new PeerInfo(listenerID);
            listenerPeerInfo.multiaddrs.add('/ip4/0.0.0.0/tcp/10333');
            listenerNode = new Node({
                peerInfo: listenerPeerInfo
            });
            listenerNode.on('peer:connect', (peerInfo) => {
                console.log("[listener:] recieved a dial from :", peerInfo.id.toB58String());
            });
            listenerNode.start(cb)
        }
    ], (err) => {
        if (err) throw err;

        console.log('-------------------------------------------------------');
        console.log('DNS listening on:');
        listenerNode.peerInfo.multiaddrs.forEach(addr => {
            console.log(addr.toString() + '/ipfs/' + listenerID.toB58String());
        })
        console.log('-------------------------------------------------------');
    });
}

startListener();
module.exports.startListener = startListener;