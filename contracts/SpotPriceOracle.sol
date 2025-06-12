pragma solidity ^0.5.16;

import "./L1Read.sol";
import "./CErc20.sol";

contract MarkPriceOracle is L1Read {
    mapping(address => uint) powers;

    function getUnderlyingPrice(CToken cToken) public view returns (uint) {
        if (compareStrings(cToken.symbol(), "cHYPE")) {
            return
                prices(0x5555555555555555555555555555555555555555) *
                powers[0x5555555555555555555555555555555555555555];
        } else {
            address asset = address(CErc20(address(cToken)).underlying());
            return prices(asset) * powers[asset];
        }
    }

    // power
    function setUnderlyingPrice(
        CToken cToken,
        uint underlyingPriceMantissa
    ) public {
        address asset = address(CErc20(address(cToken)).underlying());
        powers[asset] = underlyingPriceMantissa;
    }

    // power
    function setDirectPrice(address asset, uint price) public {
        powers[asset] = price;
    }

    function prices(address asset) public view returns (uint256) {
        /*
            HYPE 41 9710n  / index: 135 / 0x5555555555555555555555555555555555555555
            BTC  107875 0n / index: 3   / 0x09F83c5052784c63603184e016e1Db7a24626503
            ETH  2517 60n  / index: 4   / 0x5a1A1339ad9e52B7a4dF78452D5c18e8690746f3
        */
        uint32 index;
        if (asset == 0x5555555555555555555555555555555555555555) {
            index = 135;
            return uint256(markPx(index));
        } else if (asset == 0x09F83c5052784c63603184e016e1Db7a24626503) {
            index = 3;
            return uint256(markPx(index));
        } else if (asset == 0x5a1A1339ad9e52B7a4dF78452D5c18e8690746f3) {
            index = 4;
            return uint256(markPx(index));
        } else {
            revert("Not support.");
        }
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }
}
