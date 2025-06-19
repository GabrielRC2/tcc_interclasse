<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('players_teams', function(Blueprint $table){
            $table -> id();
            $table->unsignedBigInteger('fk_id_players');
            $table->unsignedBigInteger('fk_id_teams');
            $table->timestamps();

            $table->foreign('fk_id_players')->references('id')->on('players')->onDelete('cascade');
            $table->foreign('fk_id_teams')->references('id')->on('teams')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('players_teams');
    }
};
