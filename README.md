# Minting Otherdeeds with Flashbots
### Based on [github.com/flashbots/ethers-provider-flashbots-bundle](https://github.com/flashbots/ethers-provider-flashbots-bundle)

## Instructions Windows

1. Install [NodeJS LTS](https://nodejs.org/dist/v16.15.0/node-v16.15.0-x64.msi).
2. Open Powershell by hitting the start button and typing Powershell and clicking on it.
3. Type `node -v` and it should return a line that says v16.15.0 if you installed from step 1.
4. Download the code [here](https://github.com/KfishNFT/otherdeeds-flashbots/archive/refs/heads/main.zip).
5. Unzip that. If you need a program to unzip you can use something like [winrar](https://www.win-rar.com/start.html?&L=0) or [peazip](https://peazip.github.io/).
6. Back to Powershell, navigate to the location where you unzipped the code by running `cd <location>`, downloads folder would be `cd $HOME\Downloads\unzippedFolder`.
7. In the unzipped folder, copy the file .env.example and create a new one called .env with it's contents. You can use notepad.
8. You will need the private key of a wallet you own, which needs to have the APE and ETH you will use and you will need the KYC private key.
9. You also need to provide an infura or alchemy api key. I recommend [Alchemy](https://www.alchemy.com/).
10. In Powershell, type `npm install` and hopefully there are no errors!
11. Once this is setup and it's time to mint, run the command `npm run mint`. The command may fail with an error if your bundle was not included in the block. Retry if this is the case.
12. A successful command should output `Wait Response: BundleIncluded`.

## Instructions MacOS

1. Install [NodeJS LTS](https://nodejs.org/dist/v16.15.0/node-v16.15.0.pkg).
2. Open Terminal, it should be under utilities in the launchpad. If you can't find it then read [this](https://support.apple.com/guide/terminal/open-or-quit-terminal-apd5265185d-f365-44cb-8b09-71a064a42125/mac).
3. Type `node -v` and it should return a line that says v16.15.0 if you installed from step 1.
4. Download the code [here](https://github.com/KfishNFT/otherdeeds-flashbots/archive/refs/heads/main.zip).
5. Unzip that.
6. Back to Terminal. Navigate to the location where you unzipped the code by running `cd ~/location`, downloads folder would be `cd ~/Downloads/folderName`.
7. In the unzipped folder, copy the file .env.example and create a new one called .env with it's contents. Type `open .` to make contents show up on Finder.
8. You will need the private key of a wallet you own, which needs to have the APE and ETH you will use and you will need the KYC private key.
9. You also need to provide an infura or alchemy api key. I recommend [Alchemy](https://www.alchemy.com/).
10. In Terminal, type `npm install` and hopefully there are no errors!
11. Once this is setup and it's time to mint, run the command `npm run mint`. The command may fail with an error if your bundle was not included in the block. Retry if this is the case.
12. A successful command should output `Wait Response: BundleIncluded`.
