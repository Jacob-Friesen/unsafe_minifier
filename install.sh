#!/bin/bash
# This is the installation script, it is run with no flags and can also run with 'make install'

ORIGINAL_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )" # Initial directory this file is in
NODE_VERSION="v0.8.2"
UGLIFY_VERSION="2" # Any version 2 will do
FANN_FILE="/usr/local/lib/libfann.so" # A file that proves FANN exists, may have to update for non-default FANN configurations...
cyan=$(tput setaf 6)
orange=$(tput setaf 3)
blue=$(tput setaf 4)
reset=$(tput op)

function programExists() {
    local result=1
    command -v $1 >/dev/null 2>&1 || { result=0; }
    echo "$result"
}

function installNVM() {
    # Prerequisites to NVM
    printf "${blue}Installing NVM dependencies:\n"
    printf " • build-essential\n"
    printf " • libssl-dev\n"
    printf " • curl\n"
    printf " • git-core\n"
    printf "\n"
    printf "Running: ${orange}sudo apt-get install build-essential libssl-dev curl git-core${reset}\n"
    sudo apt-get install build-essential libssl-dev curl git-core
    printf "\n"

    # Installing NVM
    printf "${blue}Running: ${orange}curl https://raw.github.com/creationix/nvm/master/install.sh | sh${reset}\n"
    curl https://raw.github.com/creationix/nvm/master/install.sh | sh
    printf "\n"
    printf "${blue}NVM is now installed. Sourcing relevant profile...\n"

    # Source correct profile setting to make nvm immediatly useable
    if [ -f "$HOME/.bash_profile" ]; then
        PROFILE="$HOME/.bash_profile"
    elif [ -f "$HOME/.profile" ]; then
        PROFILE="$HOME/.profile"
    fi
    printf "Running: ${orange}source $PROFILE${reset}\n"
    source $PROFILE
    printf "${blue}$PROFILE$ sourced, NVM should now be useable.\n"
    printf "\n${reset}"
}

function installNode() {
    # Prerequisites to Node.js
    printf "${blue}Installing Node.js dependencies:\n"
    printf " • python\n"
    printf " • g++\n"
    printf " • make\n"
    printf "Running: ${orange}sudo apt-get install python g++ make${reset}\n"
    sudo apt-get install build-essential libssl-dev curl git-core
    printf "\n"

    # Installing Node
    printf "${blue}Running: ${orange}nvm install v0.8.2 ${reset}\n"
    nvm install v0.8.2
    printf "\n"
    printf "${blue}Node.js v0.8.2 is now installed\n"
    printf "\n${reset}"
}

function installFANN() {
    # Prerequisites to FANN
    printf "${blue}Installing FANN dependency:\n"
    printf " • CMAKE\n"
    printf "Running: ${orange}sudo apt-get cmake${reset}\n"
    sudo apt-get install cmake
    printf "\n"

    # Installing FANN
    printf "${blue}Do you want to download FANN into ${HOME}/Downloads? (y or full path location):\n"
    read saveLocation;
    if [ $saveLocation == 'y' ]; then
        saveLocation=${HOME}/Downloads
    fi
    printf "Running: ${orange}cd ${saveLocation}\n${reset}"
    cd "$saveLocation"
    printf "${blue}Running: ${orange}curl -LOk http://downloads.sourceforge.net/project/fann/fann/2.2.0/FANN-2.2.0-Source.zip ${reset}\n"
    curl -LOk http://downloads.sourceforge.net/project/fann/fann/2.2.0/FANN-2.2.0-Source.zip
    printf "${blue}Running: ${orange}unzip FANN-2.2.0-Source.zip\n${reset}"
    unzip FANN-2.2.0-Source.zip
    printf "${blue}Running: ${orange}cd FANN-2.2.0-Source\n${reset}"
    cd FANN-2.2.0-Source
    printf "${blue}Running: ${orange}cmake .\n${reset}"
    cmake .
    printf "${blue}Running: ${orange}sudo make install\n${reset}"
    sudo make install
    printf "${blue}Running: ${orange}sudo ldconfig\n"
    printf "${blue}This may take awhile...\n${reset}"
    sudo ldconfig
    printf "${blue}Heading back to the original directory${reset}\n"
    cd "$ORIGINAL_DIR"
    printf "${blue}FANN is now installed.=n"
    printf "\n${reset}"
}

function buildNodeFannBindings() {
    printf "${blue}Building node-fann bindings:\n"
    printf "${blue}Running: ${orange}cd node_modules/node_fann\n"
    cd node_modules/node_fann

}


printf "${cyan}\n"
printf "Welcome to the Unsafe Minifier Version 0.1 Installer\n${reset}"
printf "${blue}\n"
printf "The system will now detect and install any dependencies you are missing. The list of dependencies is under Installation in README.md.\n"
printf "\n"

# NVM and dependencies
if [ -d "$HOME/.nvm" ]; then
    printf "NVM is already installed.\n"
else
    printf "NVM (Node Version Manager) will now be installed...\n"
    installNVM
fi

# Node.js and dependencies
printf "\n"
printf "${blue}Making sure NVM is useable in this script: ${orange}[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh${reset}\n"
[[ -s $HOME/.nvm/nvm.sh ]] && . $HOME/.nvm/nvm.sh

printf "\n"
nodes=$(nvm ls 2>&1)
if [ $(programExists node) -eq '1' ] && [[ "$nodes" == *"$NODE_VERSION"* ]]; then
    printf "${blue}Node.js v0.8.2 is already installed.\n${reset}"
else
    printf "${blue}Node.js v0.8.2 will now be installed...\n${reset}"
    installNode
fi

# Switch to the correct Node.js version
printf "${blue}Switching to correct Node.js Version: ${orange}nvm use 0.8.2${reset}\n"
nvm use 0.8.2

# UglifyJS
printf "\n"
version=$(uglifyjs -V 2>&1)
if [ $(programExists uglifyjs) -eq '1' ] && [[ "$version" == *" $UGLIFY_VERSION"* ]]; then
    printf "${blue}UglifyJS is already installed.\n${reset}"
else
    printf "${blue}Installing UglifyJS (v2) globally: ${orange}npm install uglify-js -g${reset}\n"
    npm install uglify-js -g
fi

# FANN and dependencies
printf "\n"
if [ -f $FANN_FILE ]; then
    printf "${blue}FANN is already installed.\n${reset}"
else
    printf "${blue}FANN will now be installed\n"
    installFANN
fi

printf "\n"
printf "${blue}Installation is now complete. Since this bash script invokes some changes in a seperate context, make sure to source ~/.bashrc and ~/.profile. Also, make sure to switch to node v0.8.2 with nvm (nvm use 0.8.2)\n"
printf "\n${reset}"

#command -v node >/dev/null 2>&1 {local result = 0} || { local result = 0 }
