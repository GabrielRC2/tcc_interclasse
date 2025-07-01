<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\FoulResource;
use App\Models\Foul;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class FoulController extends Controller
{
    public function index(){
        return FoulResource::collection(Foul::all());
    }

    public function store(Request $request){
        try {
            $validated = $request->validate([
            'fk_id_players'=> 'required|integer',
            'yellow_card'=> 'nullable|integer',
            'red_card'=> 'nullable|integer',
            'fouls_amount'=> 'nullable|integer',
            ]);

            $foul = Foul::create($validated);
            return (new FoulResource($foul))->response()->setStatusCode(201);

        } catch (ValidationException $e) {
            // Se a validação falhar, retorne os erros em JSON com status 422 Unprocessable Entity
            return response()->json([
                'message' => 'Os dados fornecidos são inválidos.',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id){
        $foul = Foul::findOrFail($id);
        return new FoulResource($foul);
    }

    public function destroy($id){
        $foul = Foul::findOrFail($id);
        $foul->delete();
        return response()->json(['message' => 'Foul deleted successfully'], 200);
    }

    public function update($id){
        $foul = Foul::findOrFail($id);
        $foul->update();
        return (new FoulResource($foul))->response()->json(['message' => 'Foul updated successfully'], 200);
    }
}
