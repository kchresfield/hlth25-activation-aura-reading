'use client';
export default function Admin() {
    return (
        <div className="font-sans min-h-screen bg-[#001F3F] flex flex-col items-center p-0">
            <h1 className="text-white text-2xl font-bold mt-6 mb-4 w-full text-center">Aura Booking Portal</h1>
            <main className="w-full flex-1 flex flex-col items-center">
                <div id="iframeContainer" style={{position:'relative', width: '100%', height:'800px'}}>
                    {/* <div
                        id="loader"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <p>Loading calendar...</p>
                    </div> */}
                    <iframe
                        src="https://aura-reading.youcanbook.me"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        // onLoad={() => {
                        //     const loader = document.getElementById('loader');
                        //     if (loader) loader.style.display = 'none';
                        // }}
                    ></iframe>
                    
                </div>
            </main>
        </div>
    );
}
