const hre = require("hardhat");
const { upgrades } = require('hardhat');


SETTINGS = {};


async function main() {
    const deployer = (await hre.ethers.getSigners())[0];
    console.log(`Deployer: ${deployer.address}\nHYPE: ${await hre.ethers.provider.getBalance(deployer.address)}`);

    console.log("\nTokens");
    const WETH9 = await hre.ethers.getContractAt("ERC20Detailed", "0x5555555555555555555555555555555555555555");
    console.log(`- WETH9: ${await WETH9.balanceOf(deployer.address)} / ${await WETH9.decimals()}`);
    const UBTC = await hre.ethers.getContractAt("ERC20Detailed", "0x09F83c5052784c63603184e016e1Db7a24626503");
    console.log(`- UBTC: ${await UBTC.balanceOf(deployer.address)} / ${await UBTC.decimals()}`);
    const UETH = await hre.ethers.getContractAt("ERC20Detailed", "0x5a1A1339ad9e52B7a4dF78452D5c18e8690746f3");
    console.log(`- UETH: ${await UETH.balanceOf(deployer.address)} / ${await UETH.decimals()}`);


    /* Deploy: JumpRateModel (InterestRateModel) */
    console.log("\nDeploy: JumpRateModel (InterestRateModel)");

    const baseRatePerYear = hre.ethers.parseEther("0");
    const multiplierPerYear = hre.ethers.parseEther("0.05");
    const jumpMultiplierPerYear = hre.ethers.parseEther("1.09");
    const kink = hre.ethers.parseEther("0.9");

    const rateModel = await hre.ethers.deployContract(
        "JumpRateModel",
        [
            baseRatePerYear,
            multiplierPerYear,
            jumpMultiplierPerYear,
            kink
        ],
        SETTINGS
    );
    await rateModel.waitForDeployment();
    console.log(`- rateModel: ${await rateModel.getAddress()}`);


    /* Deploy: Comptroller */
    console.log("\nDeploy: Comptroller");

    // // Deploy
    // const comptroller = await hre.ethers.deployContract(
    //     "Comptroller",
    //     [],
    //     SETTINGS
    // );
    // await comptroller.waitForDeployment();
    //
    // Upgradeable Deploy
    const Comptroller = await ethers.getContractFactory('Comptroller');
    const comptroller = await upgrades.deployProxy(
        Comptroller,
        [/* initializer args, if any */],
        {
            initializer: 'initialize',
        }
    );
    await comptroller.waitForDeployment();
    //
    console.log(`- comptroller: ${await comptroller.getAddress()}`);


    /* Deploy: PriceOracle */
    console.log("\nDeploy: PriceOracle");

    const priceOracle = await hre.ethers.deployContract(
        "MarkPriceOracle",
        [],
        SETTINGS
    );
    await priceOracle.waitForDeployment();
    console.log(`- priceOracle: ${await priceOracle.getAddress()}`);


    /* Deploy: cTokens */
    console.log("\nDeploy: cTokens");

    let cHYPE;
    let cUBTC;
    let cUETH;

    // ETH (HYPE)
    {
        const params = [
            await comptroller.getAddress(), // comptroller_
            await rateModel.getAddress(), // interestRateModel_
            hre.ethers.parseUnits((0.02 * 1e10).toString(), 18), // initialExchangeRateMantissa_
            "cHYPE", // name_
            "cHYPE", // symbol_
            "8", // decimals_
            deployer.address // admin_
        ];
        cHYPE = await hre.ethers.deployContract(
            "CEther",
            params,
            SETTINGS
        );
        await cHYPE.waitForDeployment();
        console.log(`- cHYPE: ${await cHYPE.getAddress()}`);
    }

    // UBTC
    {
        const params = [
            await UBTC.getAddress(), // underlying_
            await comptroller.getAddress(), // comptroller_
            await rateModel.getAddress(), // interestRateModel_
            hre.ethers.parseUnits((0.02 * 1e10).toString(), 10), // initialExchangeRateMantissa_ // UBTC decimals = 8
            "cUBTC", // name_
            "cUBTC", // symbol_
            "8", // decimals_
            deployer.address // admin_
        ];
        cUBTC = await hre.ethers.deployContract(
            "CErc20Immutable",
            params,
            SETTINGS
        );
        await cUBTC.waitForDeployment();
        console.log(`- cUBTC: ${await cUBTC.getAddress()}`);
    }

    // UETH
    {
        const params = [
            await UETH.getAddress(), // underlying_
            await comptroller.getAddress(), // comptroller_
            await rateModel.getAddress(), // interestRateModel_
            hre.ethers.parseUnits((0.02 * 1e10).toString(), 18), // initialExchangeRateMantissa_
            "cUETH", // name_
            "cUETH", // symbol_
            "8", // decimals_
            deployer.address // admin_
        ];
        cUETH = await hre.ethers.deployContract(
            "CErc20Immutable",
            params,
            SETTINGS
        );
        await cUETH.waitForDeployment();
        console.log(`- cUETH: ${await cUETH.getAddress()}`);
    }


    // process.exit(1);


    /* Set: PriceOracle */
    console.log("\nSet: PriceOracle");

    // ETH (HYPE)
    {
        const tx = await priceOracle.setDirectPrice(
            "0x5555555555555555555555555555555555555555",
            hre.ethers.parseUnits("1", 18 - 4),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- UETH: ${tx.hash}`);
    }

    // UBTC
    {
        const tx = await priceOracle.setUnderlyingPrice(
            await cUBTC.getAddress(),
            hre.ethers.parseUnits("1", 28 - 1),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- UBTC: ${tx.hash}`);
    }

    // UETH
    {
        const tx = await priceOracle.setUnderlyingPrice(
            await cUETH.getAddress(),
            hre.ethers.parseUnits("1", 18 - 2),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- UETH: ${tx.hash}`);
    }


    /* Set: Comptroller */
    console.log("\nSet: Comptroller");

    // closeFactor
    {
        const tx = await comptroller._setCloseFactor(
            ethers.parseEther("0.1"),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- closeFactor: ${res.hash}`);
    }

    // priceOracle
    {
        const tx = await comptroller._setPriceOracle(
            await priceOracle.getAddress(),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- priceOracle: ${res.hash}`);
    }

    // setCompRate
    {
        const tx = await comptroller._setCompRate(
            "0",
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- setCompRate: ${res.hash}`);
    }

    // setLiquidationIncentive
    {
        const tx = await comptroller._setLiquidationIncentive(
            ethers.parseEther("1.1"),
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- setLiquidationIncentive: ${res.hash}`);
    }

    // setMaxAssets
    {
        const tx = await comptroller._setMaxAssets(
            4,
            SETTINGS
        );
        const res = await tx.wait();
        console.log(`- setMaxAssets: ${res.hash}`);
    }


    /* Set: cTokens */
    console.log("\nSet: cTokens");

    // supportMarket
    {
        // cHYPE
        {
            const tx = await comptroller._supportMarket(
                await cHYPE.getAddress(),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- supportMarket - cHYPE: ${res.hash}`);
        }

        // cUBTC
        {
            const tx = await comptroller._supportMarket(
                await cUBTC.getAddress(),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- supportMarket - cUBTC: ${res.hash}`);
        }

        // cUETH
        {
            const tx = await comptroller._supportMarket(
                await cUETH.getAddress(),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- supportMarket - cUETH: ${res.hash}`);
        }
    }

    // setReserveFactor
    {
        // cHYPE
        {
            const tx = await cHYPE._setReserveFactor(
                ethers.parseEther("0.3"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setReserveFactor - cHYPE: ${res.hash}`);
        }

        // cUBTC
        {
            const tx = await cUBTC._setReserveFactor(
                ethers.parseEther("0.3"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setReserveFactor - cUBTC: ${res.hash}`);
        }

        // cUETH
        {
            const tx = await cUETH._setReserveFactor(
                ethers.parseEther("0.5"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setReserveFactor - cUETH: ${res.hash}`);
        }
    }

    // setEasyModeSupport
    {
        // cHYPE
        {
            const tx = await comptroller._setEasyModeSupport(
                await cHYPE.getAddress(),
                true,
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setEasyModeSupport - cHYPE: ${res.hash}`);
        }

        // cUBTC
        {
            const tx = await comptroller._setEasyModeSupport(
                await cUBTC.getAddress(),
                false,
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setEasyModeSupport - cUBTC: ${res.hash}`);
        }

        // cUETH
        {
            const tx = await comptroller._setEasyModeSupport(
                await cUETH.getAddress(),
                true,
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setEasyModeSupport - cUETH: ${res.hash}`);
        }
    }

    // setCollateralFactor
    {
        // cHYPE
        {
            const tx = await comptroller._setCollateralFactor(
                await cHYPE.getAddress(),
                ethers.parseEther("0.3"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactor - cHYPE: ${res.hash}`);
        }

        // cUBTC
        {
            const tx = await comptroller._setCollateralFactor(
                await cUBTC.getAddress(),
                ethers.parseEther("0.7"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactor - cUBTC: ${res.hash}`);
        }

        // cUETH
        {
            const tx = await comptroller._setCollateralFactor(
                await cUETH.getAddress(),
                ethers.parseEther("0.3"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactor - cUETH: ${res.hash}`);
        }
    }

    // setCollateralFactorEasyMode
    {
        // cHYPE
        {
            const tx = await comptroller._setCollateralFactorEasyMode(
                await cHYPE.getAddress(),
                ethers.parseEther("0.7"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactorEasyMode - cHYPE: ${res.hash}`);
        }

        // cUBTC
        {
            const tx = await comptroller._setCollateralFactorEasyMode(
                await cUBTC.getAddress(),
                ethers.parseEther("0.7"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactorEasyMode - cUBTC: ${res.hash}`);
        }

        // cUETH
        {
            const tx = await comptroller._setCollateralFactorEasyMode(
                await cUETH.getAddress(),
                ethers.parseEther("0.7"),
                SETTINGS
            );
            const res = await tx.wait();
            console.log(`- setCollateralFactorEasyMode - cUETH: ${res.hash}`);
        }
    }


    /* Deploy: Maximillion */
    console.log("\nDeploy: Maximillion");

    const maximillion = await hre.ethers.deployContract(
        "Maximillion",
        [
            await cHYPE.getAddress()
        ],
        SETTINGS
    );
    await maximillion.waitForDeployment();
    console.log(`- maximillion: ${await maximillion.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
