import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Row, Form, Button, Card } from 'react-bootstrap';
import { create as ipfsHttpClient } from 'ipfs-http-client';
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');

const Home = ({ contract, account }) => {
    const [posts, setPosts] = useState('');
    const [loading, setLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);
    const [post, setPost] = useState('');
    const [address, setAddress] = useState('');
    const loadPosts = async () => {
        const address = await contract.signer.getAddress();
        setAddress(address);

        // Check if user owns an NFT
        const balance = await contract.balanceOf(account);
        setHasProfile(() => balance > 0);

        // Get all posts
        let results = await contract.getAllPosts();
        // fetch metadata of each post and add that to post object
        let posts = await Promise.all(results.map(async i => {
            // use hash to fetch the post metadata stored on ipfs
            let response = await fetch(`https://ipfs.infura.io/ipfs/${i.hash}`);
            const metadataPost = await response.json();
            // get authors NFT profile
            const nftId = await contract.profiles(i.author);
            // get URI of NFT profiles
            const uri = await contract.tokenURI(nftId);
            // fetch NFT profile metadata
            response = await fetch(uri);
            const metadataProfile = await response.json();
            // define author
            const author = {
                address: i.author,
                username: metadataProfile.username,
                avatar: metadataProfile.avatar
            };
            // define post 
            let post = {
                id: i.id,
                content: metadataPost.post,
                tip: i.tip,
                author
            };
            return post;
        }));
        // Sort posts from most tip to least
        posts = posts.sort((a,b) => b.tip - a.tip);
        setPosts(posts);
        setLoading(false);
    }
    useEffect(() => {
        // If null, load posts
        if(!posts) {
            loadPosts();
        }
    });
    const uploadPost = async () => {
        if (!post) return
            let hash;
        // Upload post to IPFS
        try {
            const result = await client.add(JSON.stringify({ post }));
            setLoading(true);
            hash = result.path;
        } catch (error) {
            window.alert("ipfs image upload error: ", error);
        }
        // upload post to blockchain
        await (await contract.uploadPost(hash)).wait();
        loadPosts();
    };
    const tip = async (post) => {
        // tip post owner
        await (await contract.tipPostOwner(post.id, { value: ethers.utils.parseEther("0.1") })).wait();
        loadPosts();
    };

    if (loading) return (
        <div className='text-center'>
                <main style={{ padding: "1rem 0"}}>
                    <h2>Loading...</h2>
                </main>
        </div>
    )
    return (
        <div className="container-fluid mt-5">
            {hasProfile ?
                (<div className="row">
                    <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px'}}>
                        <div className="content mx-auto">
                            <Row className="g-4">
                                <Form.Control onChange={(e) => setPost(e.target.value)} size="lg" required as="textarea" />
                                <div className="d-grid px-0">
                                    <Button onClick={uploadPost} variant="primary" size="lg" style={{backgroundColor: 'teal', border: 'teal'}}>
                                        CHIRP
                                    </Button>
                                </div>
                            </Row>
                        </div>
                    </main>
                </div>)    
                :
                (<div className="text-center">
                    <main style={{ padding: "1rem 0"}}>
                        <h2>Must own an NFT to post</h2>
                     </main>
                </div>)
            }
            <p>&nbsp;</p>
            <br/>
            <p className="my-auto">&nbsp;</p>
            {posts.length > 0 ?
                posts.map((post, key) => {
                    return (
                        <div key={key} className="col-lg-12 my-3 mx-auto" style={{ width: '1000px' }}>
                            <Card border="primary" style={{backgroundColor: 'gray', border: 'white'}}>
                                <Card.Header>
                                    <img
                                    className='mr-2'
                                    width='30'
                                    height='30'
                                    src={post.author.avatar}
                                    />
                                    <small className="ms-2 me-auto d-inline">
                                        {post.author.username}
                                    </small>
                                    <small className="mt-1 float-end d-line">
                                        {post.author.address}
                                    </small>
                                </Card.Header>
                                <Card.Body color="secondary">
                                    <Card.Title>
                                        {post.content}
                                    </Card.Title>
                                </Card.Body>
                                <Card.Footer className="list-group-item" style={{backgroundColor: '#818589'}}>
                                    <div className="d-inline mt-auto float-start"> Tip Amount: {ethers.utils.formatEther(post.tip)} ETH</div>
                                    {address === post.author.address || !hasProfile ?
                                        null : <div className="d-inline float-end">
                                            <Button onClick={() => tip(post)} className="px-0 py-0 font-size-16" variant="link" size="md" style={{color: 'yellow'}}>
                                                Tip for 0.1 ETH
                                            </Button>
                                        </div>}
                                </Card.Footer>
                            </Card>
                        </div>)
                })
                : (
                    <div className="text-center">
                        <main style={{ padding: "1rem 0"}}>
                            <h2>No posts yet</h2>
                        </main>
                    </div>
                )}
        </div>
    );
}

export default Home