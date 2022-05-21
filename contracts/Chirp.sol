//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/** @dev Hazel
 *  Social media dapp that tokenizes a user's short post.  
 */
contract Chirp is ERC721URIStorage {

    uint public tokenCount;
    uint public postCount;

    struct Post {
        uint id;
        string hash;
        uint tip;
        address payable author;
    }

    mapping (uint => Post) public posts;

    mapping (address => uint) public profiles;

    event PostCreated(
        uint id,
        string hash,
        uint tip,
        address payable author
    );

    event PostTipped(
        uint id,
        string hash,
        uint tip,
        address payable author
    );

    constructor() ERC721("Chirp", "CHIRP") {}

    function mint(string memory _tokenURI) external returns(uint) {
        tokenCount++;
        _safeMint(msg.sender, tokenCount);
        _setTokenURI(tokenCount, _tokenURI);
        // default avatar is newly minted token
        setProfile(tokenCount);
        return tokenCount;
    }

    function setProfile(uint _id) public {
        require(ownerOf(_id) == msg.sender, "Must own the NFT you want to select as your profile");
        profiles[msg.sender] = _id;
    }

    function uploadPost(string memory _hash) external {
        require(balanceOf(msg.sender) > 0, "Must own a Chirp NFT to post");
        require(bytes(_hash).length > 0, "Cannot pass empty hash");

        postCount++;
        posts[postCount] = Post(postCount, _hash, 0, payable(msg.sender));
        emit PostCreated(postCount, _hash, 0, payable(msg.sender));
    }

    function tipPostOwner(uint _id) external payable {
        require(_id>0 && _id<=postCount, "Invalid post ID");

        Post memory _post = posts[_id];
        require(_post.author != msg.sender, "Cannot tip your own post");
        _post.author.transfer(msg.value);
        _post.tip += msg.value;
        posts[_id] = _post;

        emit PostTipped(_id, _post.hash, msg.value, _post.author);
    }

    function getAllPosts() external view returns(Post[] memory _posts) {
        _posts = new Post[](postCount);

        for(uint i=0; i<_posts.length; i++) {
            _posts[i] = posts[i+1];
        }
    }

    function getMyNfts() external view returns(uint[] memory _ids) {
        _ids = new uint[](balanceOf(msg.sender));
        uint current;

        for(uint i=0; i<tokenCount; i++) {
            // Loop through all existing NFTs and check the author
            if(ownerOf(i+1) == msg.sender) {
                _ids[current] = i+1;
                current++;
            }
        }
    }

}
