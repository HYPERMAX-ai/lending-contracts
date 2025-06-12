// SPDX-License-Identifier: MIT

pragma solidity ^0.5.16;

contract L1Read {
    address constant MARK_PX_PRECOMPILE_ADDRESS =
        0x0000000000000000000000000000000000000806;
    address constant ORACLE_PX_PRECOMPILE_ADDRESS =
        0x0000000000000000000000000000000000000807;
    address constant SPOT_PX_PRECOMPILE_ADDRESS =
        0x0000000000000000000000000000000000000808;

    function markPx(uint32 index) public view returns (uint64) {
        bool success;
        bytes memory result;
        (success, result) = MARK_PX_PRECOMPILE_ADDRESS.staticcall(
            abi.encode(index)
        );
        require(success, "MarkPx precompile call failed");
        return abi.decode(result, (uint64));
    }

    function oraclePx(uint32 index) public view returns (uint64) {
        bool success;
        bytes memory result;
        (success, result) = ORACLE_PX_PRECOMPILE_ADDRESS.staticcall(
            abi.encode(index)
        );
        require(success, "OraclePx precompile call failed");
        return abi.decode(result, (uint64));
    }

    function spotPx(uint32 index) public view returns (uint64) {
        bool success;
        bytes memory result;
        (success, result) = SPOT_PX_PRECOMPILE_ADDRESS.staticcall(
            abi.encode(index)
        );
        require(success, "SpotPx precompile call failed");
        return abi.decode(result, (uint64));
    }
}
