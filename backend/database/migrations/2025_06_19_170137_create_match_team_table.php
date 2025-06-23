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
        Schema::create('match_team', function (Blueprint $table) {
            $table->unsignedBigInteger('fk_id_matches');
            $table->unsignedBigInteger('fk_id_teams');

            $table->foreign('fk_id_matches')->references('id')->on('matches')->onDelete('cascade');
            $table->foreign('fk_id_teams')->references('id')->on('teams')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('match_team');
    }
};
