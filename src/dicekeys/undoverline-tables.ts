////////////////////////////////////////////////////////////////////
// DiceKeys Undoverline Specification (NOT TO BE MODIFIED DIRECTLY!)
////////////////////////////////////////////////////////////////////
//
// This TypeScript (.ts) file specifies properties the underline
// and ovelrine codes used by DiceKeyss to identify each face.
//
// This file is generated automatically by the DiceKeys
// specification generator, which is written in TypeScript.
//
// That program also generates:
//    -- The SVG file that renders the appearance of each die face
//    -- The c++ (.h) version of this specification file
//
// To change the DiceKeys specification, you will need to change
// and re-run the specification program in TypeScript.
//
// To add additional definitions or help functions, create a new file
// that reads the constants you need from this file.
//

import {
  FaceIdentifiers,
  FaceLetters
} from "./face";

export const NumberOfDotsInUndoverline = 11;
export const MinNumberOfBlackDotsInUndoverline = 4;
export const MinNumberOfWhiteDotsInUndoverline = 4;

export type UnderlineCode =
	0x7 | 0xb | 0xd | 0x16 | 0x1a | 0x1e | 0x1f | 0x26 | 0x27 | 0x29 | 0x2b | 0x2c | 0x2d | 0x2e | 0x31 | 0x32 | 0x33 | 0x34 | 0x35 | 0x37 | 0x39 | 0x3a | 0x3b | 0x3c | 0x3d | 0x3e | 0x3f | 0x45 | 0x47 | 0x4a | 0x4b | 0x4c | 0x4d | 0x4e | 0x51 | 0x52 | 0x53 | 0x55 | 0x56 | 0x57 | 0x58 | 0x59 | 0x5b | 0x5c | 0x5d | 0x5e | 0x5f | 0x62 | 0x63 | 0x64 | 0x65 | 0x66 | 0x67 | 0x68 | 0x69 | 0x6a | 0x6b | 0x6d | 0x6e | 0x6f | 0x70 | 0x71 | 0x72 | 0x73 | 0x74 | 0x75 | 0x76 | 0x77 | 0x78 | 0x79 | 0x7a | 0x7b | 0x7c | 0x7d | 0x7e | 0x85 | 0x87 | 0x89 | 0x8b | 0x8d | 0x8e | 0x8f | 0x92 | 0x93 | 0x94 | 0x95 | 0x96 | 0x97 | 0x98 | 0x99 | 0x9a | 0x9b | 0x9c | 0x9d | 0x9e | 0xa1 | 0xa2 | 0xa3 | 0xa5 | 0xa6 | 0xa7 | 0xa8 | 0xaa | 0xab | 0xac | 0xad | 0xae | 0xaf | 0xb0 | 0xb1 | 0xb2 | 0xb3 | 0xb4 | 0xb5 | 0xb6 | 0xb7 | 0xb8 | 0xb9 | 0xba | 0xbb | 0xbc | 0xbd | 0xbe | 0xc1 | 0xc2 | 0xc3 | 0xc4 | 0xc6 | 0xc7 | 0xc9 | 0xca | 0xcb | 0xcc | 0xcd | 0xce | 0xcf | 0xd0 | 0xd1 | 0xd2 | 0xd3 | 0xd4 | 0xd5 | 0xd6 | 0xd7 | 0xd8 | 0xd9 | 0xda | 0xdb | 0xdc | 0xdd;
export type OverlineCode =
	0xe9 | 0xf1 | 0xe0 | 0xf2 | 0xea | 0xe1 | 0xe6 | 0xc3 | 0xc4 | 0xc6 | 0xdc | 0xca | 0xcd | 0xd0 | 0xc9 | 0xd4 | 0xd3 | 0xc5 | 0xc2 | 0xd8 | 0xda | 0xc7 | 0xc0 | 0xd6 | 0xd1 | 0xcc | 0xcb | 0xa6 | 0xbc | 0xa3 | 0xa4 | 0xb2 | 0xb5 | 0xa8 | 0xb1 | 0xac | 0xab | 0xba | 0xa7 | 0xa0 | 0xa5 | 0xa2 | 0xb8 | 0xae | 0xa9 | 0xb4 | 0xb3 | 0x9d | 0x9a | 0x8c | 0x8b | 0x96 | 0x91 | 0x94 | 0x93 | 0x8e | 0x89 | 0x98 | 0x85 | 0x82 | 0x9b | 0x9c | 0x81 | 0x86 | 0x90 | 0x97 | 0x8a | 0x8d | 0x88 | 0x8f | 0x92 | 0x95 | 0x83 | 0x84 | 0x99 | 0x6a | 0x70 | 0x72 | 0x68 | 0x79 | 0x64 | 0x63 | 0x60 | 0x67 | 0x71 | 0x76 | 0x6b | 0x6c | 0x69 | 0x6e | 0x73 | 0x74 | 0x62 | 0x65 | 0x78 | 0x4c | 0x51 | 0x56 | 0x47 | 0x5a | 0x5d | 0x58 | 0x42 | 0x45 | 0x53 | 0x54 | 0x49 | 0x4e | 0x57 | 0x50 | 0x4d | 0x4a | 0x5c | 0x5b | 0x46 | 0x41 | 0x44 | 0x43 | 0x5e | 0x59 | 0x4f | 0x48 | 0x55 | 0x34 | 0x29 | 0x2e | 0x38 | 0x22 | 0x25 | 0x27 | 0x3a | 0x3d | 0x2b | 0x2c | 0x31 | 0x36 | 0x2f | 0x28 | 0x35 | 0x32 | 0x24 | 0x23 | 0x3e | 0x39 | 0x3c | 0x3b | 0x26 | 0x21 | 0x37 | 0x30;

export interface UndoverlineCodes {
	underlineCode: UnderlineCode;
	overlineCode: OverlineCode;  
}

export interface FaceWithUndoverlineCodes extends FaceIdentifiers, UndoverlineCodes {};

export const letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes: FaceWithUndoverlineCodes[] = [
	{
		"letter": "A",
		"digit": "1",
		"underlineCode": 7,
		"overlineCode": 233
	},
	{
		"letter": "A",
		"digit": "2",
		"underlineCode": 11,
		"overlineCode": 241
	},
	{
		"letter": "A",
		"digit": "3",
		"underlineCode": 13,
		"overlineCode": 224
	},
	{
		"letter": "A",
		"digit": "4",
		"underlineCode": 22,
		"overlineCode": 242
	},
	{
		"letter": "A",
		"digit": "5",
		"underlineCode": 26,
		"overlineCode": 234
	},
	{
		"letter": "A",
		"digit": "6",
		"underlineCode": 30,
		"overlineCode": 225
	},
	{
		"letter": "B",
		"digit": "1",
		"underlineCode": 31,
		"overlineCode": 230
	},
	{
		"letter": "B",
		"digit": "2",
		"underlineCode": 38,
		"overlineCode": 195
	},
	{
		"letter": "B",
		"digit": "3",
		"underlineCode": 39,
		"overlineCode": 196
	},
	{
		"letter": "B",
		"digit": "4",
		"underlineCode": 41,
		"overlineCode": 198
	},
	{
		"letter": "B",
		"digit": "5",
		"underlineCode": 43,
		"overlineCode": 220
	},
	{
		"letter": "B",
		"digit": "6",
		"underlineCode": 44,
		"overlineCode": 202
	},
	{
		"letter": "C",
		"digit": "1",
		"underlineCode": 45,
		"overlineCode": 205
	},
	{
		"letter": "C",
		"digit": "2",
		"underlineCode": 46,
		"overlineCode": 208
	},
	{
		"letter": "C",
		"digit": "3",
		"underlineCode": 49,
		"overlineCode": 201
	},
	{
		"letter": "C",
		"digit": "4",
		"underlineCode": 50,
		"overlineCode": 212
	},
	{
		"letter": "C",
		"digit": "5",
		"underlineCode": 51,
		"overlineCode": 211
	},
	{
		"letter": "C",
		"digit": "6",
		"underlineCode": 52,
		"overlineCode": 197
	},
	{
		"letter": "D",
		"digit": "1",
		"underlineCode": 53,
		"overlineCode": 194
	},
	{
		"letter": "D",
		"digit": "2",
		"underlineCode": 55,
		"overlineCode": 216
	},
	{
		"letter": "D",
		"digit": "3",
		"underlineCode": 57,
		"overlineCode": 218
	},
	{
		"letter": "D",
		"digit": "4",
		"underlineCode": 58,
		"overlineCode": 199
	},
	{
		"letter": "D",
		"digit": "5",
		"underlineCode": 59,
		"overlineCode": 192
	},
	{
		"letter": "D",
		"digit": "6",
		"underlineCode": 60,
		"overlineCode": 214
	},
	{
		"letter": "E",
		"digit": "1",
		"underlineCode": 61,
		"overlineCode": 209
	},
	{
		"letter": "E",
		"digit": "2",
		"underlineCode": 62,
		"overlineCode": 204
	},
	{
		"letter": "E",
		"digit": "3",
		"underlineCode": 63,
		"overlineCode": 203
	},
	{
		"letter": "E",
		"digit": "4",
		"underlineCode": 69,
		"overlineCode": 166
	},
	{
		"letter": "E",
		"digit": "5",
		"underlineCode": 71,
		"overlineCode": 188
	},
	{
		"letter": "E",
		"digit": "6",
		"underlineCode": 74,
		"overlineCode": 163
	},
	{
		"letter": "F",
		"digit": "1",
		"underlineCode": 75,
		"overlineCode": 164
	},
	{
		"letter": "F",
		"digit": "2",
		"underlineCode": 76,
		"overlineCode": 178
	},
	{
		"letter": "F",
		"digit": "3",
		"underlineCode": 77,
		"overlineCode": 181
	},
	{
		"letter": "F",
		"digit": "4",
		"underlineCode": 78,
		"overlineCode": 168
	},
	{
		"letter": "F",
		"digit": "5",
		"underlineCode": 81,
		"overlineCode": 177
	},
	{
		"letter": "F",
		"digit": "6",
		"underlineCode": 82,
		"overlineCode": 172
	},
	{
		"letter": "G",
		"digit": "1",
		"underlineCode": 83,
		"overlineCode": 171
	},
	{
		"letter": "G",
		"digit": "2",
		"underlineCode": 85,
		"overlineCode": 186
	},
	{
		"letter": "G",
		"digit": "3",
		"underlineCode": 86,
		"overlineCode": 167
	},
	{
		"letter": "G",
		"digit": "4",
		"underlineCode": 87,
		"overlineCode": 160
	},
	{
		"letter": "G",
		"digit": "5",
		"underlineCode": 88,
		"overlineCode": 165
	},
	{
		"letter": "G",
		"digit": "6",
		"underlineCode": 89,
		"overlineCode": 162
	},
	{
		"letter": "H",
		"digit": "1",
		"underlineCode": 91,
		"overlineCode": 184
	},
	{
		"letter": "H",
		"digit": "2",
		"underlineCode": 92,
		"overlineCode": 174
	},
	{
		"letter": "H",
		"digit": "3",
		"underlineCode": 93,
		"overlineCode": 169
	},
	{
		"letter": "H",
		"digit": "4",
		"underlineCode": 94,
		"overlineCode": 180
	},
	{
		"letter": "H",
		"digit": "5",
		"underlineCode": 95,
		"overlineCode": 179
	},
	{
		"letter": "H",
		"digit": "6",
		"underlineCode": 98,
		"overlineCode": 157
	},
	{
		"letter": "I",
		"digit": "1",
		"underlineCode": 99,
		"overlineCode": 154
	},
	{
		"letter": "I",
		"digit": "2",
		"underlineCode": 100,
		"overlineCode": 140
	},
	{
		"letter": "I",
		"digit": "3",
		"underlineCode": 101,
		"overlineCode": 139
	},
	{
		"letter": "I",
		"digit": "4",
		"underlineCode": 102,
		"overlineCode": 150
	},
	{
		"letter": "I",
		"digit": "5",
		"underlineCode": 103,
		"overlineCode": 145
	},
	{
		"letter": "I",
		"digit": "6",
		"underlineCode": 104,
		"overlineCode": 148
	},
	{
		"letter": "J",
		"digit": "1",
		"underlineCode": 105,
		"overlineCode": 147
	},
	{
		"letter": "J",
		"digit": "2",
		"underlineCode": 106,
		"overlineCode": 142
	},
	{
		"letter": "J",
		"digit": "3",
		"underlineCode": 107,
		"overlineCode": 137
	},
	{
		"letter": "J",
		"digit": "4",
		"underlineCode": 109,
		"overlineCode": 152
	},
	{
		"letter": "J",
		"digit": "5",
		"underlineCode": 110,
		"overlineCode": 133
	},
	{
		"letter": "J",
		"digit": "6",
		"underlineCode": 111,
		"overlineCode": 130
	},
	{
		"letter": "K",
		"digit": "1",
		"underlineCode": 112,
		"overlineCode": 155
	},
	{
		"letter": "K",
		"digit": "2",
		"underlineCode": 113,
		"overlineCode": 156
	},
	{
		"letter": "K",
		"digit": "3",
		"underlineCode": 114,
		"overlineCode": 129
	},
	{
		"letter": "K",
		"digit": "4",
		"underlineCode": 115,
		"overlineCode": 134
	},
	{
		"letter": "K",
		"digit": "5",
		"underlineCode": 116,
		"overlineCode": 144
	},
	{
		"letter": "K",
		"digit": "6",
		"underlineCode": 117,
		"overlineCode": 151
	},
	{
		"letter": "L",
		"digit": "1",
		"underlineCode": 118,
		"overlineCode": 138
	},
	{
		"letter": "L",
		"digit": "2",
		"underlineCode": 119,
		"overlineCode": 141
	},
	{
		"letter": "L",
		"digit": "3",
		"underlineCode": 120,
		"overlineCode": 136
	},
	{
		"letter": "L",
		"digit": "4",
		"underlineCode": 121,
		"overlineCode": 143
	},
	{
		"letter": "L",
		"digit": "5",
		"underlineCode": 122,
		"overlineCode": 146
	},
	{
		"letter": "L",
		"digit": "6",
		"underlineCode": 123,
		"overlineCode": 149
	},
	{
		"letter": "M",
		"digit": "1",
		"underlineCode": 124,
		"overlineCode": 131
	},
	{
		"letter": "M",
		"digit": "2",
		"underlineCode": 125,
		"overlineCode": 132
	},
	{
		"letter": "M",
		"digit": "3",
		"underlineCode": 126,
		"overlineCode": 153
	},
	{
		"letter": "M",
		"digit": "4",
		"underlineCode": 133,
		"overlineCode": 106
	},
	{
		"letter": "M",
		"digit": "5",
		"underlineCode": 135,
		"overlineCode": 112
	},
	{
		"letter": "M",
		"digit": "6",
		"underlineCode": 137,
		"overlineCode": 114
	},
	{
		"letter": "N",
		"digit": "1",
		"underlineCode": 139,
		"overlineCode": 104
	},
	{
		"letter": "N",
		"digit": "2",
		"underlineCode": 141,
		"overlineCode": 121
	},
	{
		"letter": "N",
		"digit": "3",
		"underlineCode": 142,
		"overlineCode": 100
	},
	{
		"letter": "N",
		"digit": "4",
		"underlineCode": 143,
		"overlineCode": 99
	},
	{
		"letter": "N",
		"digit": "5",
		"underlineCode": 146,
		"overlineCode": 96
	},
	{
		"letter": "N",
		"digit": "6",
		"underlineCode": 147,
		"overlineCode": 103
	},
	{
		"letter": "O",
		"digit": "1",
		"underlineCode": 148,
		"overlineCode": 113
	},
	{
		"letter": "O",
		"digit": "2",
		"underlineCode": 149,
		"overlineCode": 118
	},
	{
		"letter": "O",
		"digit": "3",
		"underlineCode": 150,
		"overlineCode": 107
	},
	{
		"letter": "O",
		"digit": "4",
		"underlineCode": 151,
		"overlineCode": 108
	},
	{
		"letter": "O",
		"digit": "5",
		"underlineCode": 152,
		"overlineCode": 105
	},
	{
		"letter": "O",
		"digit": "6",
		"underlineCode": 153,
		"overlineCode": 110
	},
	{
		"letter": "P",
		"digit": "1",
		"underlineCode": 154,
		"overlineCode": 115
	},
	{
		"letter": "P",
		"digit": "2",
		"underlineCode": 155,
		"overlineCode": 116
	},
	{
		"letter": "P",
		"digit": "3",
		"underlineCode": 156,
		"overlineCode": 98
	},
	{
		"letter": "P",
		"digit": "4",
		"underlineCode": 157,
		"overlineCode": 101
	},
	{
		"letter": "P",
		"digit": "5",
		"underlineCode": 158,
		"overlineCode": 120
	},
	{
		"letter": "P",
		"digit": "6",
		"underlineCode": 161,
		"overlineCode": 76
	},
	{
		"letter": "R",
		"digit": "1",
		"underlineCode": 162,
		"overlineCode": 81
	},
	{
		"letter": "R",
		"digit": "2",
		"underlineCode": 163,
		"overlineCode": 86
	},
	{
		"letter": "R",
		"digit": "3",
		"underlineCode": 165,
		"overlineCode": 71
	},
	{
		"letter": "R",
		"digit": "4",
		"underlineCode": 166,
		"overlineCode": 90
	},
	{
		"letter": "R",
		"digit": "5",
		"underlineCode": 167,
		"overlineCode": 93
	},
	{
		"letter": "R",
		"digit": "6",
		"underlineCode": 168,
		"overlineCode": 88
	},
	{
		"letter": "S",
		"digit": "1",
		"underlineCode": 170,
		"overlineCode": 66
	},
	{
		"letter": "S",
		"digit": "2",
		"underlineCode": 171,
		"overlineCode": 69
	},
	{
		"letter": "S",
		"digit": "3",
		"underlineCode": 172,
		"overlineCode": 83
	},
	{
		"letter": "S",
		"digit": "4",
		"underlineCode": 173,
		"overlineCode": 84
	},
	{
		"letter": "S",
		"digit": "5",
		"underlineCode": 174,
		"overlineCode": 73
	},
	{
		"letter": "S",
		"digit": "6",
		"underlineCode": 175,
		"overlineCode": 78
	},
	{
		"letter": "T",
		"digit": "1",
		"underlineCode": 176,
		"overlineCode": 87
	},
	{
		"letter": "T",
		"digit": "2",
		"underlineCode": 177,
		"overlineCode": 80
	},
	{
		"letter": "T",
		"digit": "3",
		"underlineCode": 178,
		"overlineCode": 77
	},
	{
		"letter": "T",
		"digit": "4",
		"underlineCode": 179,
		"overlineCode": 74
	},
	{
		"letter": "T",
		"digit": "5",
		"underlineCode": 180,
		"overlineCode": 92
	},
	{
		"letter": "T",
		"digit": "6",
		"underlineCode": 181,
		"overlineCode": 91
	},
	{
		"letter": "U",
		"digit": "1",
		"underlineCode": 182,
		"overlineCode": 70
	},
	{
		"letter": "U",
		"digit": "2",
		"underlineCode": 183,
		"overlineCode": 65
	},
	{
		"letter": "U",
		"digit": "3",
		"underlineCode": 184,
		"overlineCode": 68
	},
	{
		"letter": "U",
		"digit": "4",
		"underlineCode": 185,
		"overlineCode": 67
	},
	{
		"letter": "U",
		"digit": "5",
		"underlineCode": 186,
		"overlineCode": 94
	},
	{
		"letter": "U",
		"digit": "6",
		"underlineCode": 187,
		"overlineCode": 89
	},
	{
		"letter": "V",
		"digit": "1",
		"underlineCode": 188,
		"overlineCode": 79
	},
	{
		"letter": "V",
		"digit": "2",
		"underlineCode": 189,
		"overlineCode": 72
	},
	{
		"letter": "V",
		"digit": "3",
		"underlineCode": 190,
		"overlineCode": 85
	},
	{
		"letter": "V",
		"digit": "4",
		"underlineCode": 193,
		"overlineCode": 52
	},
	{
		"letter": "V",
		"digit": "5",
		"underlineCode": 194,
		"overlineCode": 41
	},
	{
		"letter": "V",
		"digit": "6",
		"underlineCode": 195,
		"overlineCode": 46
	},
	{
		"letter": "W",
		"digit": "1",
		"underlineCode": 196,
		"overlineCode": 56
	},
	{
		"letter": "W",
		"digit": "2",
		"underlineCode": 198,
		"overlineCode": 34
	},
	{
		"letter": "W",
		"digit": "3",
		"underlineCode": 199,
		"overlineCode": 37
	},
	{
		"letter": "W",
		"digit": "4",
		"underlineCode": 201,
		"overlineCode": 39
	},
	{
		"letter": "W",
		"digit": "5",
		"underlineCode": 202,
		"overlineCode": 58
	},
	{
		"letter": "W",
		"digit": "6",
		"underlineCode": 203,
		"overlineCode": 61
	},
	{
		"letter": "X",
		"digit": "1",
		"underlineCode": 204,
		"overlineCode": 43
	},
	{
		"letter": "X",
		"digit": "2",
		"underlineCode": 205,
		"overlineCode": 44
	},
	{
		"letter": "X",
		"digit": "3",
		"underlineCode": 206,
		"overlineCode": 49
	},
	{
		"letter": "X",
		"digit": "4",
		"underlineCode": 207,
		"overlineCode": 54
	},
	{
		"letter": "X",
		"digit": "5",
		"underlineCode": 208,
		"overlineCode": 47
	},
	{
		"letter": "X",
		"digit": "6",
		"underlineCode": 209,
		"overlineCode": 40
	},
	{
		"letter": "Y",
		"digit": "1",
		"underlineCode": 210,
		"overlineCode": 53
	},
	{
		"letter": "Y",
		"digit": "2",
		"underlineCode": 211,
		"overlineCode": 50
	},
	{
		"letter": "Y",
		"digit": "3",
		"underlineCode": 212,
		"overlineCode": 36
	},
	{
		"letter": "Y",
		"digit": "4",
		"underlineCode": 213,
		"overlineCode": 35
	},
	{
		"letter": "Y",
		"digit": "5",
		"underlineCode": 214,
		"overlineCode": 62
	},
	{
		"letter": "Y",
		"digit": "6",
		"underlineCode": 215,
		"overlineCode": 57
	},
	{
		"letter": "Z",
		"digit": "1",
		"underlineCode": 216,
		"overlineCode": 60
	},
	{
		"letter": "Z",
		"digit": "2",
		"underlineCode": 217,
		"overlineCode": 59
	},
	{
		"letter": "Z",
		"digit": "3",
		"underlineCode": 218,
		"overlineCode": 38
	},
	{
		"letter": "Z",
		"digit": "4",
		"underlineCode": 219,
		"overlineCode": 33
	},
	{
		"letter": "Z",
		"digit": "5",
		"underlineCode": 220,
		"overlineCode": 55
	},
	{
		"letter": "Z",
		"digit": "6",
		"underlineCode": 221,
		"overlineCode": 48
	}
];

export const decodeUnderlineIndexTable: (number|null)[] =
	[null,null,null,null,null,null,null,0,null,null,null,1,null,2,null,null,null,null,null,null,null,null,3,null,null,null,4,null,null,null,5,6,null,null,null,null,null,null,7,8,null,9,null,10,11,12,13,null,null,14,15,16,17,18,null,19,null,20,21,22,23,24,25,26,null,null,null,null,null,27,null,28,null,null,29,30,31,32,33,null,null,34,35,36,null,37,38,39,40,41,null,42,43,44,45,46,null,null,47,48,49,50,51,52,53,54,55,56,null,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,null,null,null,null,null,null,75,null,76,null,77,null,78,null,79,80,81,null,null,82,83,84,85,86,87,88,89,90,91,92,93,94,null,null,95,96,97,null,98,99,100,101,null,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,null,null,123,124,125,126,null,127,128,null,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
export const decodeOverlineIndexTable: (number|null)[] =
	[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,147,127,141,140,128,146,129,137,124,null,132,133,null,125,136,149,134,139,null,123,138,135,148,126,143,130,145,144,131,142,null,null,115,102,117,116,103,114,98,121,106,111,null,95,110,107,120,109,96,null,104,105,122,97,108,101,119,99,113,112,100,118,null,82,null,92,81,80,93,null,83,78,88,75,86,87,null,89,null,76,84,77,90,91,null,85,null,94,79,null,null,null,null,null,null,null,62,59,72,73,58,63,null,68,56,66,50,49,67,55,69,64,52,70,54,53,71,51,65,57,74,48,60,61,47,null,null,39,null,41,29,30,40,27,38,33,44,null,36,35,null,43,null,null,34,31,46,45,32,null,null,42,null,37,null,28,null,null,null,22,null,18,7,8,17,9,21,null,14,11,26,25,12,null,null,13,24,null,16,15,null,23,null,19,null,20,null,10,null,null,null,2,5,null,null,null,null,6,null,null,0,4,null,null,null,null,null,null,1,3,null,null,null,null,null,null,null,null,null,null,null,null,null];

export const decodeUnderlineTable: (FaceWithUndoverlineCodes | undefined)[] = decodeUnderlineIndexTable.map( (i) =>
	(i == null) ? undefined :  letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[i] );
export const decodeOverlineTable: (FaceWithUndoverlineCodes | undefined)[] = decodeOverlineIndexTable.map( (i) =>
	(i == null) ? undefined :  letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[i] );

export function getUndoverlineCodes(face: FaceIdentifiers): UndoverlineCodes {
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(face.letter) * 6) + (parseInt(face.digit) -1);
  return letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
}

export function addUndoverlineCodes<T extends FaceIdentifiers>(face: T): T & UndoverlineCodes {
  const {underlineCode, overlineCode} = getUndoverlineCodes(face);
  return Object.assign(face, {underlineCode, overlineCode});
}
  
